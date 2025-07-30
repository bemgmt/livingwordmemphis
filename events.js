const calendarId = "https://calendar.google.com/calendar/embed?src=marketing%40livingwordmemphis.org&ctz=America%2FChicago";
const apiKey = "YOUR_PUBLIC_GOOGLE_API_KEY"; // get this below
const now = new Date().toISOString();
const url = `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events?key=${apiKey}&timeMin=${now}&singleEvents=true&orderBy=startTime&maxResults=5`;

fetch(url)
  .then(response => response.json())
  .then(data => {
    const events = data.items;
    const container = document.querySelector(".event-list");

    container.innerHTML = ""; // Clear existing static events

    if (events.length === 0) {
      container.innerHTML = "<p>No upcoming events.</p>";
      return;
    }

    events.forEach(event => {
      const start = event.start.dateTime || event.start.date;
      const description = event.description || "";
      const image = "img/default-event.jpg"; // You can enhance this with a custom image system

      const html = `
        <div class="event-card">
          <img src="${image}" alt="${event.summary} Thumbnail" />
          <div class="event-info">
            <h4>${event.summary}</h4>
            <p><i class="fas fa-calendar-alt"></i> ${new Date(start).toLocaleString()}</p>
            <p>${description}</p>
          </div>
        </div>
      `;
      container.innerHTML += html;
    });
  })
  .catch(error => {
    console.error("Error fetching events:", error);
    document.querySelector(".event-list").innerHTML = "<p>Unable to load events.</p>";
  });
