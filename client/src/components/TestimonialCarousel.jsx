import { useEffect, useState } from "react";

const testimonials = [
  {
    image: "/img/testimonial-1.jpg",
    name: "Client Name",
    profession: "Profession",
    text: "Aliquyam sed elitr elitr erat sed diam ipsum eirmod eos lorem nonumy. Tempor sea ipsum diam sed clita dolore eos dolores magna erat dolore sed stet justo et dolor.",
  },
  {
    image: "/img/testimonial-2.jpg",
    name: "Client Name",
    profession: "Profession",
    text: "Aliquyam sed elitr elitr erat sed diam ipsum eirmod eos lorem nonumy. Tempor sea ipsum diam sed clita dolore eos dolores magna erat dolore sed stet justo et dolor.",
  },
  {
    image: "/img/testimonial-3.jpg",
    name: "Client Name",
    profession: "Profession",
    text: "Aliquyam sed elitr elitr erat sed diam ipsum eirmod eos lorem nonumy. Tempor sea ipsum diam sed clita dolore eos dolores magna erat dolore sed stet justo et dolor.",
  },
];

function TestimonialCarousel() {
  const [currentTestimonial, setCurrentTestimonial] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial((current) =>
        current === testimonials.length - 1 ? 0 : current + 1
      );
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const previousTestimonial = () => {
    setCurrentTestimonial((current) =>
      current === 0 ? testimonials.length - 1 : current - 1
    );
  };

  const nextTestimonial = () => {
    setCurrentTestimonial((current) =>
      current === testimonials.length - 1 ? 0 : current + 1
    );
  };

  const testimonial = testimonials[currentTestimonial];

  return (
    <div className="react-testimonial-carousel">
      <div className="react-testimonial-slide position-relative">
        <i
          className="fa fa-3x fa-quote-right text-primary position-absolute"
          style={{
            top: "-6px",
            right: 0,
          }}
        ></i>

        <div className="d-flex align-items-center mb-3">
          <img
            className="img-fluid rounded-circle"
            src={testimonial.image}
            style={{
              width: "60px",
              height: "60px",
              objectFit: "cover",
            }}
            alt={testimonial.name}
          />

          <div className="ml-3">
            <h6 className="text-uppercase">
              {testimonial.name}
            </h6>

            <span>
              {testimonial.profession}
            </span>
          </div>
        </div>

        <p className="m-0">
          {testimonial.text}
        </p>
      </div>

      {/* Previous */}
      <button
        type="button"
        className="react-testimonial-prev"
        onClick={previousTestimonial}
        aria-label="Previous testimonial"
      >
        <i className="fa fa-angle-left"></i>
      </button>

      {/* Next */}
      <button
        type="button"
        className="react-testimonial-next"
        onClick={nextTestimonial}
        aria-label="Next testimonial"
      >
        <i className="fa fa-angle-right"></i>
      </button>

      {/* Indicators */}
      <div className="react-testimonial-indicators">
        {testimonials.map((item, index) => (
          <button
            key={index}
            type="button"
            className={
              currentTestimonial === index
                ? "react-testimonial-dot active"
                : "react-testimonial-dot"
            }
            onClick={() => setCurrentTestimonial(index)}
            aria-label={`Show testimonial ${index + 1}`}
          ></button>
        ))}
      </div>
    </div>
  );
}

export default TestimonialCarousel;