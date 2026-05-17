// Frontend logic for the QuickSlot Parking Reviews page.
// Connects to the NoSQL backend running on port 5001.
// Demonstrates all CRUD operations: Create, Read, Update, Delete.

const API = 'http://localhost:5001/api';

// --- Star rating logic ---

let selectedRating = 0;

// Highlight stars up to the one the user clicked
document.querySelectorAll('#star-input span').forEach((star) => {
  star.addEventListener('click', () => {
    selectedRating = Number(star.dataset.val);
    document.getElementById('rating').value = selectedRating;
    document.querySelectorAll('#star-input span').forEach((s) => {
      s.classList.toggle('active', Number(s.dataset.val) <= selectedRating);
    });
  });
});

// --- Helper functions ---

// Returns a string of star characters based on a numeric rating
function starsDisplay(n) {
  return '★'.repeat(n) + '☆'.repeat(5 - n);
}

// Formats a MongoDB date string into a readable format
function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

// Shows a temporary message banner on the add-review form
function showBanner(type, msg) {
  const el = document.getElementById(type === 'error' ? 'form-error' : 'form-success');
  el.textContent = msg;
  el.style.display = 'block';
  setTimeout(() => { el.style.display = 'none'; }, 3000);
}

// --- CREATE — submit a new review ---

async function addReview() {
  const lot_id       = document.getElementById('lot_id').value;
  const lot_name     = document.getElementById('lot_id').options[document.getElementById('lot_id').selectedIndex].text;
  const reviewer_name = document.getElementById('reviewer_name').value.trim();
  const rating       = Number(document.getElementById('rating').value);
  const comment      = document.getElementById('comment').value.trim();

  if (!reviewer_name || !comment) {
    return showBanner('error', 'Please fill in your name and comment.');
  }
  if (rating === 0) {
    return showBanner('error', 'Please select a star rating.');
  }

  try {
    const res = await fetch(`${API}/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lot_id, lot_name, reviewer_name, rating, comment }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    // Clear form after successful submit
    document.getElementById('reviewer_name').value = '';
    document.getElementById('comment').value = '';
    document.getElementById('rating').value = 0;
    selectedRating = 0;
    document.querySelectorAll('#star-input span').forEach((s) => s.classList.remove('active'));

    showBanner('success', 'Review submitted!');
    loadReviews();
  } catch (err) {
    showBanner('error', err.message || 'Failed to submit review.');
  }
}

// --- READ — load and display all reviews (or filtered by lot) ---

async function loadReviews() {
  const filterLot = document.getElementById('filter-lot').value;
  const container = document.getElementById('reviews-list');
  container.innerHTML = '<p class="empty">Loading…</p>';

  try {
    // If a lot is selected, fetch reviews only for that lot
    const url = filterLot
      ? `${API}/reviews/lot/${filterLot}`
      : `${API}/reviews`;

    const res  = await fetch(url);
    const data = await res.json();

    if (!res.ok) throw new Error(data.error);

    const reviews = data.reviews;

    if (reviews.length === 0) {
      container.innerHTML = '<p class="empty">No reviews yet. Be the first to write one!</p>';
      return;
    }

    // Build HTML for each review document
    container.innerHTML = reviews.map((r) => `
      <div class="review-item" id="review-${r._id}">
        <div class="review-top">
          <div>
            <div class="review-name">${r.reviewer_name}</div>
            <div class="review-lot">${r.lot_name}</div>
          </div>
          <div class="review-stars">${starsDisplay(r.rating)}</div>
        </div>
        <div class="review-comment">${r.comment}</div>
        <div class="review-date">${formatDate(r.created_at)}</div>
        <div class="review-actions">
          <button class="btn-edit" onclick="openEdit('${r._id}', ${r.rating}, \`${r.comment.replace(/`/g, "'")}\`)">Edit</button>
          <button class="btn-danger" onclick="deleteReview('${r._id}')">Delete</button>
        </div>
        <div class="edit-form" id="edit-${r._id}">
          <div class="field">
            <label>New rating</label>
            <div class="stars-input" id="edit-stars-${r._id}">
              <span data-val="1">★</span><span data-val="2">★</span>
              <span data-val="3">★</span><span data-val="4">★</span><span data-val="5">★</span>
            </div>
            <input type="hidden" id="edit-rating-${r._id}" value="${r.rating}" />
          </div>
          <div class="field">
            <label>Updated comment</label>
            <textarea id="edit-comment-${r._id}">${r.comment}</textarea>
          </div>
          <button class="btn btn-primary" style="font-size:0.85rem;padding:0.4rem 1rem" onclick="saveEdit('${r._id}')">Save</button>
          <button class="btn" style="font-size:0.85rem;padding:0.4rem 1rem;margin-left:6px;background:#f3f4f6" onclick="closeEdit('${r._id}')">Cancel</button>
        </div>
      </div>
    `).join('');

    // Attach star click handlers to all edit forms
    reviews.forEach((r) => {
      let editRating = r.rating;
      const editStars = document.querySelectorAll(`#edit-stars-${r._id} span`);

      // Highlight stars matching the current rating
      editStars.forEach((s) => {
        s.classList.toggle('active', Number(s.dataset.val) <= editRating);
        s.addEventListener('click', () => {
          editRating = Number(s.dataset.val);
          document.getElementById(`edit-rating-${r._id}`).value = editRating;
          editStars.forEach((es) => {
            es.classList.toggle('active', Number(es.dataset.val) <= editRating);
          });
        });
      });
    });

  } catch (err) {
    container.innerHTML = `<p class="empty" style="color:#b91c1c">${err.message}</p>`;
  }
}

// --- UPDATE helpers ---

function openEdit(id, rating, comment) {
  document.getElementById(`edit-${id}`).classList.add('open');
}

function closeEdit(id) {
  document.getElementById(`edit-${id}`).classList.remove('open');
}

async function saveEdit(id) {
  const comment = document.getElementById(`edit-comment-${id}`).value.trim();
  const rating  = Number(document.getElementById(`edit-rating-${id}`).value);

  if (!comment) return alert('Comment cannot be empty.');
  if (rating === 0) return alert('Please select a rating.');

  try {
    const res = await fetch(`${API}/reviews/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ comment, rating }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    loadReviews();
  } catch (err) {
    alert(err.message || 'Failed to update review.');
  }
}

// --- DELETE ---

async function deleteReview(id) {
  if (!confirm('Delete this review?')) return;

  try {
    const res = await fetch(`${API}/reviews/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    // Remove the review card from the page without reloading
    const el = document.getElementById(`review-${id}`);
    if (el) el.remove();
  } catch (err) {
    alert(err.message || 'Failed to delete review.');
  }
}

// Load reviews when page opens
loadReviews();