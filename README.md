# rssextensions-page

Website for **RSS Extensions** — Invisible K-Tip hair extensions by Rosaisela at Studio Privé, Logan Square, Chicago.

A plain HTML/CSS site with no build step, ready for GitHub Pages.

| File | What it is |
|---|---|
| `index.html` | The main one-page website |
| `consultation.html` | The consultation form (all "Book" buttons link here) |
| `thank-you.html` | Page clients see after the form is sent |
| `styles.css` | All styling |
| `form.js` | Form checks, photo previews, and photo shrinking before upload |
| `images/` | Photos and logos |

## How the consultation form is delivered

The form posts to [FormSubmit](https://formsubmit.co), which emails each submission (answers and photos) to **rssextensions@gmail.com**. No account is needed.

- **First submission only:** FormSubmit sends an activation email to rssextensions@gmail.com. Click **Activate Form** in that email, and every submission after that is delivered.
- To change the email address, edit the `action="https://formsubmit.co/..."` line in `consultation.html`.
- Photos are resized to at most 1600px in the browser before sending, so phone photos upload quickly.
