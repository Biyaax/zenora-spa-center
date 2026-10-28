const crypto = require("node:crypto");
const db = require("../database/postgres");
const config = require("../config");
const { sendMail } = require("../lib/mailer");
const { badRequest, HttpError } = require("../lib/errors");
const digest = value => crypto.createHmac("sha256", config.jwtSecret).update(value).digest("hex");
const proofError = () => badRequest("Verify your Gmail with a new code before creating an account.", { fields: { email: "Gmail verification is required before account creation." } });
async function send(email) {
  const id = crypto.randomBytes(32).toString("hex");
  const code = String(crypto.randomInt(0,100000000)).padStart(8,"0");
  const result = await db.query(`
    INSERT INTO registration_email_codes (id,email,code_hash,expires_at)
    VALUES ($1,$2,$3,CURRENT_TIMESTAMP + INTERVAL '10 minutes')
    ON CONFLICT(email) DO UPDATE SET id=EXCLUDED.id,code_hash=EXCLUDED.code_hash,
      expires_at=EXCLUDED.expires_at,attempts=0,sent_at=CURRENT_TIMESTAMP,
      verified_at=NULL,proof_hash=NULL,proof_expires_at=NULL
    WHERE registration_email_codes.sent_at < CURRENT_TIMESTAMP - INTERVAL '1 minute'
    RETURNING id
  `,[id,email,digest(`${id}:${email}:${code}`)]);
  if (!result.rows.length) throw new HttpError(429,"Please wait one minute before requesting another code.");
  const delivery = await sendMail({to:email,subject:"Your Zenora registration code",
    text:`Your Zenora verification code is: ${code}\n\nIt expires in 10 minutes. Enter it in the registration form. No account has been created yet. Do not share this code. If you did not request it, ignore this email.`});
  if (!delivery.sent) {
    await db.query("DELETE FROM registration_email_codes WHERE id=$1",[id]);
    throw new HttpError(503,"The verification code could not be sent. No account was created. Please try again after email delivery is configured.");
  }
  return {challengeId:id,expiresIn:600,resendAfter:60,message:"Verification code sent. Enter the 8-digit code from your Gmail inbox. No account has been created yet."};
}
async function verify({email,challengeId,code}) {
  if(typeof challengeId!=="string" || !/^[a-f0-9]{64}$/.test(challengeId) || typeof code!=="string" || !/^\d{8}$/.test(code)) throw badRequest("Enter the 8-digit code from your Gmail inbox.");
  const client=await db.connect();let failure,proof;
  try {
    await client.query("BEGIN");
    const result=await client.query("SELECT *,expires_at>CURRENT_TIMESTAMP AS valid FROM registration_email_codes WHERE id=$1 AND email=$2 FOR UPDATE",[challengeId,email]);
    const row=result.rows[0];
    if(!row || !row.valid) failure=badRequest("This code is invalid or expired. Request a new code.");
    else if(row.verified_at) failure=badRequest("This code was already used. Request a new code if your verification has expired.");
    else if(row.attempts>=5) failure=new HttpError(429,"Too many incorrect codes. Request a new code.");
    else if(!crypto.timingSafeEqual(Buffer.from(row.code_hash),Buffer.from(digest(`${challengeId}:${email}:${code}`)))) {
      await client.query("UPDATE registration_email_codes SET attempts=attempts+1 WHERE id=$1",[challengeId]);
      failure=badRequest(`Incorrect code. ${4-row.attempts} attempts remaining.`);
    } else {
      proof=crypto.randomBytes(32).toString("hex");
      await client.query("UPDATE registration_email_codes SET verified_at=CURRENT_TIMESTAMP,proof_hash=$1,proof_expires_at=CURRENT_TIMESTAMP + INTERVAL '5 minutes' WHERE id=$2",[digest("proof:"+proof),challengeId]);
    }
    await client.query("COMMIT");
  } catch(error) {await client.query("ROLLBACK");throw error;} finally{client.release();}
  if(failure)throw failure;
  return {verificationToken:proof,expiresIn:300,message:"Gmail verified. You can now create your account."};
}
async function consume(client,email,proof) {
  if(typeof proof!=="string" || !/^[a-f0-9]{64}$/.test(proof))throw proofError();
  const found=await client.query("SELECT id FROM registration_email_codes WHERE email=$1 AND proof_hash=$2 AND verified_at IS NOT NULL AND proof_expires_at>CURRENT_TIMESTAMP FOR UPDATE",[email,digest("proof:"+proof)]);
  if(!found.rows[0])throw proofError();
  await client.query("DELETE FROM registration_email_codes WHERE id=$1",[found.rows[0].id]);
}
module.exports={send,verify,consume,proofError};
