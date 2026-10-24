function BackToTop() {
  const scrollToTop = (event) => {
    event.preventDefault();

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <a
      href="#top"
      className="btn btn-lg btn-primary back-to-top"
      onClick={scrollToTop}
      style={{ display: "flex" }}
      aria-label="Back to top"
    >
      <i className="fa fa-angle-double-up"></i>
    </a>
  );
}

export default BackToTop;