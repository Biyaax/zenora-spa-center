import { useMemo, useState } from 'react';
import { jsPDF } from 'jspdf';
import { autoTable } from 'jspdf-autotable';

import {
  getManager,
  peso,
  dateText,
  localYMD,
} from '../../components/manager/api';

import {
  Button,
  Card,
  DataTable,
  EmptyState,
  ErrorState,
  Loading,
  Notice,
  PageHeader,
  StatCard,
  useLoad,
} from '../../components/manager/UI';


/* =========================================================
   CSV HELPERS
========================================================= */

const quote = (value) => {
  const raw = String(value ?? '');

  const safe = /^[=+@-]/.test(raw)
    ? "'" + raw
    : raw;

  return `"${safe.replaceAll('"', '""')}"`;
};


function downloadCsv(rows) {
  const lines = [
    [
      'Date Paid',
      'Amount (PHP)',
      'Payment Method',
      'Reference',
    ],

    ...rows.map((payment) => [
      payment.paid_at || '',
      payment.amount || 0,
      payment.payment_method || '',
      payment.reference_number || '',
    ]),
  ];

  const blob = new Blob(
    [
      '\uFEFF' +
        lines
          .map((row) =>
            row.map(quote).join(',')
          )
          .join('\r\n'),
    ],
    {
      type: 'text/csv;charset=utf-8',
    }
  );

  const url = URL.createObjectURL(blob);

  const anchor = document.createElement('a');

  anchor.href = url;
  anchor.download = 'zenora-revenue-report.csv';

  anchor.click();

  URL.revokeObjectURL(url);
}


/* =========================================================
   PDF HELPERS
========================================================= */

function pdfMoney(value) {
  return `PHP ${Number(value || 0).toLocaleString(
    'en-PH',
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }
  )}`;
}


function getReportPeriodText(period, anchor) {
  const selected = new Date(
    `${anchor}T12:00:00`
  );

  if (period === 'Daily') {
    return dateText(anchor);
  }

  if (period === 'Monthly') {
    return selected.toLocaleDateString(
      'en-PH',
      {
        month: 'long',
        year: 'numeric',
      }
    );
  }

  const start = new Date(selected);

  start.setDate(
    start.getDate() -
      ((start.getDay() + 6) % 7)
  );

  const end = new Date(start);

  end.setDate(start.getDate() + 6);

  return `${start.toLocaleDateString(
    'en-PH',
    {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }
  )} - ${end.toLocaleDateString(
    'en-PH',
    {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }
  )}`;
}


function downloadPdf({
  rows,
  total,
  period,
  anchor,
}) {
  if (!rows.length) {
    return;
  }

  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const generatedAt =
    new Date().toLocaleString('en-PH', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });

  const reportPeriod =
    getReportPeriodText(period, anchor);

  /* ---------- HEADER ---------- */

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);

  doc.text(
    'ZENORA SPA & MASSAGE WELLNESS CENTER',
    14,
    16
  );

  doc.setFontSize(14);

  doc.text(
    'Recorded Revenue Report',
    14,
    24
  );

  doc.setFont(
    'helvetica',
    'normal'
  );

  doc.setFontSize(9);

  doc.text(
    `Report Type: ${period}`,
    14,
    31
  );

  doc.text(
    `Period: ${reportPeriod}`,
    14,
    36
  );

  doc.text(
    `Generated: ${generatedAt}`,
    14,
    41
  );


  /* ---------- SUMMARY ---------- */

  doc.setFont(
    'helvetica',
    'bold'
  );

  doc.setFontSize(10);

  doc.text(
    `Total Transactions: ${rows.length}`,
    190,
    31
  );

  doc.text(
    `Recorded Revenue: ${pdfMoney(total)}`,
    190,
    37
  );


  /* ---------- TABLE ---------- */

  autoTable(doc, {
    startY: 48,

    head: [
      [
        'Date Paid',
        'Payment Method',
        'Reference',
        'Amount',
      ],
    ],

    body: rows.map((payment) => [
      dateText(payment.paid_at),
      payment.payment_method ||
        'Unspecified',
      payment.reference_number ||
        'Not provided',
      pdfMoney(payment.amount),
    ]),

    theme: 'grid',

    styles: {
      font: 'helvetica',
      fontSize: 9,
      cellPadding: 3,
      valign: 'middle',
    },

    headStyles: {
      fontStyle: 'bold',
      halign: 'center',
    },

    columnStyles: {
      0: {
        cellWidth: 55,
      },

      1: {
        cellWidth: 55,
      },

      2: {
        cellWidth: 90,
      },

      3: {
        cellWidth: 55,
        halign: 'right',
      },
    },

    didDrawPage: () => {
      const pageCount =
        doc.getNumberOfPages();

      doc.setFontSize(8);

      doc.setFont(
        'helvetica',
        'normal'
      );

      doc.text(
        `Zenora Revenue Report - Page ${pageCount}`,
        14,
        202
      );
    },
  });


  /* ---------- FINAL TOTAL ---------- */

  const finalY =
    doc.lastAutoTable?.finalY || 55;

  const totalY = Math.min(
    finalY + 10,
    195
  );

  doc.setFont(
    'helvetica',
    'bold'
  );

  doc.setFontSize(11);

  doc.text(
    `TOTAL RECORDED REVENUE: ${pdfMoney(
      total
    )}`,
    190,
    totalY
  );


  /* ---------- FILE NAME ---------- */

  const safeAnchor =
    String(anchor).replaceAll('-', '');

  const fileName =
    `zenora-revenue-report-${period.toLowerCase()}-${safeAnchor}.pdf`;

  doc.save(fileName);
}


/* =========================================================
   COMPONENT
========================================================= */

export default function ManagerPaymentReports() {
  const [period, setPeriod] =
    useState('Daily');

  const [anchor, setAnchor] =
    useState(
      localYMD(new Date())
    );

  const [tab, setTab] =
    useState('Revenue Report');


  /* =======================================================
     LOAD DATA
  ======================================================= */

  const {
    data,
    loading,
    error,
    retry,
  } = useLoad(
    () =>
      getManager(
        '/reports/payments'
      ),
    []
  );

  const payments =
    data?.payments || [];


  /* =======================================================
     FILTER PAYMENTS
  ======================================================= */

  const included = useMemo(
    () =>
      payments.filter(
        (payment) => {
          const raw = String(
            payment.paid_at || ''
          ).slice(0, 10);

          if (
            !/^\d{4}-\d{2}-\d{2}$/.test(
              raw
            )
          ) {
            return false;
          }

          const selected =
            new Date(
              `${anchor}T12:00:00`
            );

          const date =
            new Date(
              `${raw}T12:00:00`
            );


          /* DAILY */

          if (
            period === 'Daily'
          ) {
            return raw === anchor;
          }


          /* MONTHLY */

          if (
            period === 'Monthly'
          ) {
            return (
              raw.slice(0, 7) ===
              anchor.slice(0, 7)
            );
          }


          /* WEEKLY */

          const start =
            new Date(selected);

          start.setDate(
            start.getDate() -
              ((start.getDay() + 6) %
                7)
          );

          const end =
            new Date(start);

          end.setDate(
            start.getDate() + 7
          );

          return (
            date >= start &&
            date < end
          );
        }
      ),
    [
      payments,
      period,
      anchor,
    ]
  );


  /* =======================================================
     SUMMARY
  ======================================================= */

  const total =
    included.reduce(
      (value, payment) =>
        value +
        Number(
          payment.amount || 0
        ),
      0
    );


  const byDay =
    Object.entries(
      included.reduce(
        (object, payment) => {
          const date =
            String(
              payment.paid_at
            ).slice(0, 10);

          object[date] =
            (object[date] || 0) +
            Number(
              payment.amount || 0
            );

          return object;
        },
        {}
      )
    ).sort(([a], [b]) =>
      a.localeCompare(b)
    );


  const max =
    Math.max(
      1,
      ...byDay.map(
        ([, value]) => value
      )
    );


  /* =======================================================
     EXPORT
  ======================================================= */

  const handlePdfExport = () => {
    downloadPdf({
      rows: included,
      total,
      period,
      anchor,
    });
  };


  /* =======================================================
     UI
  ======================================================= */

  return (
    <>
      <PageHeader
        title="Reports"
        subtitle="Monitor bookings and recorded payments, without payroll or inventory features."
        action={
          <div className="zm-actions">

            <Button
              kind="outline"
              onClick={() =>
                window.print()
              }
            >
              <i className="fa fa-print" />
              {' '}
              Print
            </Button>


            <Button
              kind="outline"
              onClick={
                handlePdfExport
              }
              disabled={
                !included.length
              }
            >
              <i className="fa fa-file-pdf" />
              {' '}
              Export PDF
            </Button>


            <Button
              onClick={() =>
                downloadCsv(
                  included
                )
              }
              disabled={
                !included.length
              }
            >
              <i className="fa fa-file-csv" />
              {' '}
              Export CSV
            </Button>

          </div>
        }
      />


      <Card>

        {/* ===============================================
            FILTER TOOLBAR
        =============================================== */}

        <div className="zm-toolbar">

          <div
            className="zm-tabs"
            role="tablist"
          >
            {[
              'Daily',
              'Weekly',
              'Monthly',
            ].map((item) => (
              <button
                key={item}
                role="tab"
                aria-selected={
                  period === item
                }
                className={
                  period === item
                    ? 'selected'
                    : ''
                }
                onClick={() =>
                  setPeriod(item)
                }
              >
                {item}
              </button>
            ))}
          </div>


          <label>
            Reference date

            <input
              type="date"
              value={anchor}
              onChange={(event) =>
                setAnchor(
                  event.target.value
                )
              }
            />
          </label>

        </div>


        {/* ===============================================
            DATA NOTICE
        =============================================== */}

        <Notice>
          The backend currently supplies manually
          recorded payments (latest 200), not complete
          booking/service report endpoints. Revenue below
          is calculated only from those returned payments,
          so it may not represent all historical payments.
        </Notice>


        {/* ===============================================
            ERROR
        =============================================== */}

        {error && (
          <ErrorState
            message={error}
            onRetry={retry}
          />
        )}


        {/* ===============================================
            LOADING
        =============================================== */}

        {loading ? (
          <Loading />
        ) : (
          !error && (
            <>

              {/* =========================================
                  SUMMARY CARDS
              ========================================= */}

              <div className="zm-stats-grid compact">

                <StatCard
                  label="Total Bookings"
                  value="—"
                  icon="fa-calendar-alt"
                  note="Booking report API needed"
                />

                <StatCard
                  label="Completed"
                  value="—"
                  icon="fa-check-circle"
                  note="Booking status API needed"
                />

                <StatCard
                  label="Cancelled / No-Show"
                  value="—"
                  icon="fa-times-circle"
                  note="Booking status API needed"
                />

                <StatCard
                  label="Recorded Revenue"
                  value={
                    peso(total)
                  }
                  icon="fa-coins"
                  note={`${included.length} payments in selected period`}
                />

              </div>


              {/* =========================================
                  REPORT TABS
              ========================================= */}

              <div
                className="zm-tabs"
                role="tablist"
              >
                {[
                  'Booking Report',
                  'Service Report',
                  'Revenue Report',
                ].map((item) => (
                  <button
                    role="tab"
                    aria-selected={
                      tab === item
                    }
                    key={item}
                    className={
                      tab === item
                        ? 'selected'
                        : ''
                    }
                    onClick={() =>
                      setTab(item)
                    }
                  >
                    {item}
                  </button>
                ))}
              </div>


              {/* =========================================
                  BOOKING REPORT
              ========================================= */}

              {tab ===
              'Booking Report' ? (

                <EmptyState
                  title="Booking report not available"
                  description="Needs date, status and therapist information from a Manager bookings endpoint."
                />


              ) : tab ===
                'Service Report' ? (

                /* =======================================
                   SERVICE REPORT
                ======================================= */

                <EmptyState
                  title="Service report not available"
                  description="Needs bookings and payments grouped by service from the backend."
                />


              ) : (

                /* =======================================
                   REVENUE REPORT
                ======================================= */

                <>

                  <div className="zm-card-head">
                    <h2>
                      Recorded Revenue
                    </h2>

                    <span>
                      {peso(total)}
                    </span>
                  </div>


                  {/* =====================================
                      CHART
                  ===================================== */}

                  {byDay.length ? (

                    <div
                      className="zm-chart"
                      aria-label="Daily recorded revenue chart"
                    >

                      {byDay.map(
                        ([
                          date,
                          value,
                        ]) => (

                          <div
                            className="zm-bar-item"
                            key={date}
                          >

                            <span>
                              {dateText(
                                date
                              )}
                            </span>


                            <div className="zm-bar-track">

                              <div
                                style={{
                                  width:
                                    `${(
                                      value /
                                      max
                                    ) *
                                      100}%`,
                                }}
                              />

                            </div>


                            <strong>
                              {peso(
                                value
                              )}
                            </strong>

                          </div>
                        )
                      )}

                    </div>

                  ) : (

                    <EmptyState
                      title="No recorded payments in this period"
                    />

                  )}


                  {/* =====================================
                      PAYMENT TABLE
                  ===================================== */}

                  <DataTable
                    headers={[
                      'Date',
                      'Method',
                      'Reference',
                      'Amount',
                    ]}
                    empty="No payment transactions found"
                  >

                    {included.map(
                      (payment) => (

                        <tr
                          key={
                            payment.id
                          }
                        >

                          <td>
                            {dateText(
                              payment.paid_at
                            )}
                          </td>

                          <td>
                            {payment.payment_method ||
                              'Unspecified'}
                          </td>

                          <td>
                            {payment.reference_number ||
                              'Not provided'}
                          </td>

                          <td>
                            <strong>
                              {peso(
                                payment.amount
                              )}
                            </strong>
                          </td>

                        </tr>
                      )
                    )}

                  </DataTable>

                </>

              )}

            </>
          )
        )}

      </Card>
    </>
  );
}