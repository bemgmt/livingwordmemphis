document.addEventListener('DOMContentLoaded', () => {
  const eventContainer = document.querySelector('.event-list');

  const calendarId = 'YOUR_CALENDAR_ID';
  const apiKey = 'YOUR_GOOGLE_API_KEY';
  const timeMin = new Date().toISOString();

  const endpoint = `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events?key=${apiKey}&singleEvents=true&orderBy=startTime&timeMin=${timeMin}&maxResults=3`;

  fetch(endpoint)
  .then(response => response.json())
  .then(data => {
    const events = data.items || [];

    if (events.length === 0) {
      eventContainer.innerHTML = '<p>No upcoming events found.</p>';
      return;
    }

    eventContainer.innerHTML = '';

    events.forEach(event => {
      const start = event.start.dateTime || event.start.date;
      const date = new Date(start);
      const formattedDate = date.toLocaleString('en-US', {
        dateStyle: 'long',
        timeStyle: event.start.dateTime ? 'short' : undefined,
      });

      const title = event.summary || 'Untitled Event';
      const rawDescription = event.description || '';

      // 🔍 Parse image URL from description using "IMG:" marker
      const imageMatch = rawDescription.match(/IMG:\s*(https?:\/\/\S+)/i);
      const image = imageMatch ? imageMatch[1] : 'img/default-event.jpg';

      // Remove IMG tag from displayed text
      const cleanDescription = rawDescription.replace(/IMG:\s*(https?:\/\/\S+)/i, '').trim();

      const card = document.createElement('div');
      card.classList.add('event-card');

      card.innerHTML = `
        <img src="${image}" alt="${title}" />
        <div class="event-info">
          <h4>${title}</h4>
          <p><i class="fas fa-calendar-alt"></i> ${formattedDate}</p>
          <p>${cleanDescription}</p>
        </div>
      `;

      eventContainer.appendChild(card);
    });
  })
    .catch(error => {
      console.error('Error fetching events:', error);
      eventContainer.innerHTML = '<p>Unable to load events at this time.</p>';
    });
  });