function continueAs(role) {

    if (role === "customer") {
        window.location.href = "customer-auth.html";
    }

    else if (role === "creator") {
       window.location.href = "creator-auth.html";
    }

}