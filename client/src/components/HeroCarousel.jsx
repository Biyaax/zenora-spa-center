import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const slides = [
  {
    image: "/img/carousel-1.jpg",
    title: "Massage Treatment",
  },
  {
    image: "/img/carousel-2.jpg",
    title: "Facial Treatment",
  },
  {
    image: "/img/carousel-3.jpg",
    title: "Cellulite Treatment",
  },
];

function HeroCarousel() {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((current) =>
        current === slides.length - 1 ? 0 : current + 1
      );
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const goToSlide = (index) => {
    setCurrentSlide(index);
  };

  const previousSlide = () => {
    setCurrentSlide((current) =>
      current === 0 ? slides.length - 1 : current - 1
    );
  };

  const nextSlide = () => {
    setCurrentSlide((current) =>
      current === slides.length - 1 ? 0 : current + 1
    );
  };

  return (
    <div className="container-fluid p-0 mb-5 pb-5">
      <div
        id="header-carousel"
        className="carousel slide carousel-fade"
      >
        {/* Indicators */}
        <ol className="carousel-indicators">
          {slides.map((slide, index) => (
            <li
              key={slide.title}
              className={currentSlide === index ? "active" : ""}
              onClick={() => goToSlide(index)}
              style={{ cursor: "pointer" }}
              aria-label={`Go to slide ${index + 1}`}
            ></li>
          ))}
        </ol>

        {/* Slides */}
        <div className="carousel-inner">
          {slides.map((slide, index) => (
            <div
              key={slide.title}
              className={`carousel-item position-relative ${
                currentSlide === index ? "active" : ""
              }`}
              style={{ minHeight: "100vh" }}
            >
              <img
                className="position-absolute w-100 h-100"
                src={slide.image}
                style={{ objectFit: "cover" }}
                alt={slide.title}
              />

              <div className="carousel-caption d-flex flex-column align-items-center justify-content-center">
                <div
                  className="p-3"
                  style={{ maxWidth: "900px" }}
                >
                  <h6
                    className="text-white text-uppercase mb-3 animate__animated animate__fadeInDown"
                    style={{ letterSpacing: "3px" }}
                  >
                    Spa & Beauty Center
                  </h6>

                  <h3 className="display-3 text-capitalize text-white mb-3">
                    {slide.title}
                  </h3>

                  <p className="mx-md-5 px-5">
                    Lorem rebum magna dolore amet lorem eirmod magna erat diam
                    stet. Sadips duo stet amet amet ndiam elitr ipsum labore
                    diam
                  </p>

                  <Link
                    className="btn btn-outline-light py-3 px-4 mt-3 animate__animated animate__fadeInUp"
                    to="/appointment"
                  >
                    Make Appointment
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Previous button */}
        <button
          type="button"
          className="carousel-control-prev"
          onClick={previousSlide}
          aria-label="Previous slide"
        >
          <span
            className="carousel-control-prev-icon"
            aria-hidden="true"
          ></span>
        </button>

        {/* Next button */}
        <button
          type="button"
          className="carousel-control-next"
          onClick={nextSlide}
          aria-label="Next slide"
        >
          <span
            className="carousel-control-next-icon"
            aria-hidden="true"
          ></span>
        </button>
      </div>
    </div>
  );
}

export default HeroCarousel;