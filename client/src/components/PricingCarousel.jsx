import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import packages from "../data/packages";
import services from "../data/services";

function PricingCarousel() {
  const [currentPackage, setCurrentPackage] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPackage((current) =>
        current === packages.length - 1
          ? 0
          : current + 1
      );
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const previousPackage = () => {
    setCurrentPackage((current) =>
      current === 0
        ? packages.length - 1
        : current - 1
    );
  };

  const nextPackage = () => {
    setCurrentPackage((current) =>
      current === packages.length - 1
        ? 0
        : current + 1
    );
  };

  const packageItem = packages[currentPackage];

  const includedServices = packageItem.serviceIds
    .map((serviceId) =>
      services.find(
        (service) => service.id === serviceId
      )
    )
    .filter(Boolean);

  return (
    <div className="react-pricing-carousel">
      <div className="bg-white react-pricing-card">
        <div className="border-bottom border-primary p-4">
          <div className="d-flex align-items-center justify-content-between">
            <h1 className="display-4 mb-0">
              <small
                className="align-top text-muted font-weight-medium"
                style={{
                  fontSize: "22px",
                  lineHeight: "45px",
                }}
              >
                ₱
              </small>

              {packageItem.price.toLocaleString()}
            </h1>

            <h5 className="text-primary text-uppercase m-0 text-right">
              {packageItem.name}
            </h5>
          </div>

          <p className="text-muted mt-3 mb-0">
            {packageItem.description}
          </p>
        </div>

        <div className="p-4">
          <h6 className="text-uppercase mb-3">
            Package Includes
          </h6>

          {includedServices.map((service) => (
            <p key={service.id}>
              <i className="fa fa-check text-success mr-2"></i>

              {service.name}

              <span className="text-muted ml-2">
                ({service.durationMinutes} min)
              </span>
            </p>
          ))}

          <Link
            to="/appointment"
            className="btn btn-primary my-2"
          >
            Book Appointment
          </Link>
        </div>
      </div>

      {/* Previous */}
      <button
        type="button"
        className="react-pricing-prev"
        onClick={previousPackage}
        aria-label="Previous package"
      >
        <i className="fa fa-angle-left"></i>
      </button>

      {/* Next */}
      <button
        type="button"
        className="react-pricing-next"
        onClick={nextPackage}
        aria-label="Next package"
      >
        <i className="fa fa-angle-right"></i>
      </button>

      {/* Indicators */}
      <div className="react-pricing-indicators">
        {packages.map((item, index) => (
          <button
            key={item.id}
            type="button"
            className={
              currentPackage === index
                ? "react-pricing-dot active"
                : "react-pricing-dot"
            }
            onClick={() =>
              setCurrentPackage(index)
            }
            aria-label={`Show ${item.name}`}
          ></button>
        ))}
      </div>
    </div>
  );
}

export default PricingCarousel;