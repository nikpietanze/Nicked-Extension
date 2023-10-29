export const btnStyles = {
    position: "relative",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    height: "31px",
    padding: "8px",
    marginTop: "-5px",
    marginBottom: "10px",
    backgroundColor: "rgb(55 48 163 / 1)",
    borderColor: "rgb(60 53 168 / 1)",
    borderRadius: "100px",
    color: "#ffffff",
    transition: "all 0.3s ease",
    boxShadow: "0 2px 5px 0 rgba(213, 217, 217, .5)",
    borderStyle: "solid",
    borderWidth: "1px",
    cursor: "pointer",
    textAlign: "center",
    textDecoration: "none!important",
};

export const loaderStyles = {
    height: "20px",
    width: "250px",
    position: "absolute",
    top: "4px",
    bottom: "0",
    left: "8px",
    right: "8px",
    margin: "auto",
}

export const loaderDotStyles = {
    animationName: "loader",
    animationTimingFunction: "ease-in-out",
    animationDuration: "3s",
    animationIterationCount: "infinite",
    height: "16px",
    width: "16px",
    borderRadius: "100%",
    backgroundColor: "rgb(99 102 241)",
    position: "absolute",
    opacity: 0.6,
}

export const loaderDotDelays = [500, 400, 300, 200, 100, 0];

export const loaderDotBgs = ["#01f997", "#14e8ab", "#1fdeb7", "#34cccc", "#47bbe0", "#5da8f7"];

export const btnImgStyles = {
    position: "absolute",
    top: "52%",
    left: "5px",
    transform: "translateY(-50%)",
    width: "20px",
    height: "20px",
}
