import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import services from "../data/services";

function ServiceCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [itemsPerView, setItemsPerView] = useState(3);

  useEffect(() => {
    const updateItemsPerView = () => {
      if (window.innerWidth < 576) {
        setItemsPerView(1);
      } else if (window.innerWidth < 992) {
        setItemsPerView(2);
      } else {
        setItemsPerView(3);
      }
    };

    updateItemsPerView();

    window.addEventListener("resize", updateItemsPerView);

    return () => {
      window.removeEventListener("resize", updateItemsPerView);
    };
  }, []);

  const maxIndex = Math.max(0, services.length - itemsPerView);

  useEffect(() => {
    if (currentIndex > maxIndex) {
      setCurrentIndex(maxIndex);
    }
  }, [currentIndex, maxIndex]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((current) =>
        current >= maxIndex ? 0 : current + 1
      );
    }, 5000);

    return () => clearInterval(interval);
  }, [maxIndex]);

  const previousSlide = () => {
    setCurrentIndex((current) =>
      current <= 0 ? maxIndex : current - 1
    );
  };

  const nextSlide = () => {
    setCurrentIndex((current) =>
      current >= maxIndex ? 0 : current + 1
    );
  };

  return (
    <div className="react-service-carousel">
      <div className="react-service-viewport">
        <div
          className="react-service-track"
          style={{
            transform: `translateX(-${
              currentIndex * (100 / itemsPerView)
            }%)`,
          }}
        >
          {services.map((service) => (
            <div
              className="react-service-slide"
              key={service.id}
              style={{
                flex: `0 0 ${100 / itemsPerView}%`,
              }}
            >
              <div className="service-item position-relative">
                <img
                  className="img-fluid"
                  src={service.image}
                  alt={service.name}
                />

                <div className="service-text text-center">
                  <h4 className="text-white font-weight-medium px-3">
                    {service.name}
                  </h4>

                  <p className="text-white px-3 mb-2">
                    {service.description}
                  </p>

                  <p className="text-white font-weight-bold mb-1">
                    ₱{service.price.toLocaleString()}
                  </p>

                  <p className="text-white mb-3">
                    {service.durationMinutes} minutes
                  </p>

                  <div className="w-100 bg-white text-center p-4">
                    <Link
                      className="btn btn-primary"
                      to="/appointment"
                    >
                      Book Service
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <button
        type="button"
        className="react-service-prev"
        onClick={previousSlide}
        aria-label="Previous services"
      >
        <i className="fa fa-angle-left"></i>
      </button>

      <button
        type="button"
        className="react-service-next"
        onClick={nextSlide}
        aria-label="Next services"
      >
        <i className="fa fa-angle-right"></i>
      </button>
    </div>
  );
}

export default ServiceCarousel;