// Initialize AOS after the AOS library has loaded.
(function () {
    function initializeTimaBeautyAOS() {
        if (!window.AOS) {
            console.warn("TimaBeauty: AOS library is not available.");
            return;
        }

        document.documentElement.classList.add("aos-ready");

        window.AOS.init({
            duration: 1000,
            easing: "ease-in-out",
            once: true,
            offset: 80,
            delay: 0,
            mirror: false,
            anchorPlacement: "top-bottom"
        });

        window.AOS.refreshHard();
        console.log("TimaBeauty: AOS animations initialized successfully.");
    }

    if (document.readyState === "complete") {
        initializeTimaBeautyAOS();
    } else {
        window.addEventListener("load", initializeTimaBeautyAOS, { once: true });
    }
})();
