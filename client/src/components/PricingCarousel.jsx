import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const plans = [
  {
    name: "Basic Plan",
    price: 49,
  },
  {
    name: "Family Plan",
    price: 99,
  },
  {
    name: "VIP Plan",
    price: 149,
  },
];

const features = [
  "Full Body Massage",
  "Deep Tissue Massage",
  "Hot Stone Massage",
  "Tissue Body Polish",
  "Foot & Nail Care",
];

function PricingCarousel() {
  const [currentPlan, setCurrentPlan] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPlan((current) =>
        current === plans.length - 1 ? 0 : current + 1
      );
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const previousPlan = () => {
    setCurrentPlan((current) =>
      current === 0 ? plans.length - 1 : current - 1
    );
  };

  const nextPlan = () => {
    setCurrentPlan((current) =>
      current === plans.length - 1 ? 0 : current + 1
    );
  };

  const plan = plans[currentPlan];

  return (
    <div className="react-pricing-carousel">
      <div className="bg-white react-pricing-card">
        <div className="d-flex align-items-center justify-content-between border-bottom border-primary p-4">
          <h1 className="display-4 mb-0">
            <small
              className="align-top text-muted font-weight-medium"
              style={{
                fontSize: "22px",
                lineHeight: "45px",
              }}
            >
              $
            </small>

            {plan.price}

            <small
              className="align-bottom text-muted font-weight-medium"
              style={{
                fontSize: "16px",
                lineHeight: "40px",
              }}
            >
              /Mo
            </small>
          </h1>

          <h5 className="text-primary text-uppercase m-0">
            {plan.name}
          </h5>
        </div>

        <div className="p-4">
          {features.map((feature) => (
            <p key={feature}>
              <i className="fa fa-check text-success mr-2"></i>
              {feature}
            </p>
          ))}

          <Link
            to="/appointment"
            className="btn btn-primary my-2"
          >
            Order Now
          </Link>
        </div>
      </div>

      {/* Previous */}
      <button
        type="button"
        className="react-pricing-prev"
        onClick={previousPlan}
        aria-label="Previous pricing plan"
      >
        <i className="fa fa-angle-left"></i>
      </button>

      {/* Next */}
      <button
        type="button"
        className="react-pricing-next"
        onClick={nextPlan}
        aria-label="Next pricing plan"
      >
        <i className="fa fa-angle-right"></i>
      </button>

      {/* Indicators */}
      <div className="react-pricing-indicators">
        {plans.map((item, index) => (
          <button
            key={item.name}
            type="button"
            className={
              currentPlan === index
                ? "react-pricing-dot active"
                : "react-pricing-dot"
            }
            onClick={() => setCurrentPlan(index)}
            aria-label={`Show ${item.name}`}
          ></button>
        ))}
      </div>
    </div>
  );
}

export default PricingCarousel;