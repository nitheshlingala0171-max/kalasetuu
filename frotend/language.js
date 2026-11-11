
let selectedLanguage = "";

function selectLanguage(language) {

    selectedLanguage = language;

    // Remove previous selection
    document.querySelectorAll(".language-grid button")
        .forEach(button => {
            button.classList.remove("selected");
        });

    // Highlight selected language
    const buttons = document.querySelectorAll(".language-grid button");

    const languageCodes = [
        "en", "te", "hi", "ta", "kn",
        "ml", "mr", "bn", "gu", "pa"
    ];

    const index = languageCodes.indexOf(language);

    if (index !== -1) {
        buttons[index].classList.add("selected");
    }
}

function continueToSite() {

    if (!selectedLanguage) {
        alert("Please select a language first.");
        return;
    }

    localStorage.setItem("selectedLanguage", selectedLanguage);

    window.location.href = "role.html";
}
