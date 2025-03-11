// Contact Form Submission
document.addEventListener("DOMContentLoaded", function () {
    const contactForm = document.getElementById("contactForm");
  
    contactForm.addEventListener("submit", function (event) {
      event.preventDefault();
  
      // Get form values
      const name = document.getElementById("name").value;
      const email = document.getElementById("email").value;
      const phone = document.getElementById("phone").value;
      const query = document.getElementById("query").value;
  
      // Prepare email body
      const emailBody = `Name: ${name}%0D%0AEmail: ${email}%0D%0APhone: ${phone}%0D%0AQuery: ${query}`;
      const emailSubject = "Query from Drainage Block Alert Website";
      const emailTo = "";
  
      // Open default email client
      window.location.href = `mailto:${emailTo}?subject=${emailSubject}&body=${emailBody}`;
  
      // Prepare WhatsApp message
      const whatsappMessage = `Name: ${name}%0AEmail: ${email}%0APhone: ${phone}%0AQuery: ${query}`;
      const whatsappUrl = ``;
  
      // Open WhatsApp in a new tab
      window.open(whatsappUrl, "_blank");
    });
  });