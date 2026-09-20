"use client";

import { useState, useEffect } from "react";
import { Review } from "../../../data/mockReviews";

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [replyingTo, setReplyingTo] = useState<Review | null>(null);
  const [replyText, setReplyText] = useState("");

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const res = await fetch('/api/reviews');
        if (res.ok) {
          const data = await res.json();
          setReviews(data);
        }
      } catch (err) {
        console.error("Failed to fetch reviews", err);
      }
    };
    fetchReviews();
  }, []);

  const handleReplySubmit = async () => {
    if (!replyingTo) return;
    const updatedReview = { ...replyingTo, reply: replyText };
    
    try {
      const res = await fetch('/api/reviews', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedReview)
      });
      
      if (res.ok) {
        setReviews(reviews.map(r => r.id === replyingTo.id ? updatedReview : r));
        setReplyingTo(null);
        setReplyText("");
        alert("Reply sent successfully!");
      }
    } catch (err) {
      alert("Failed to send reply");
    }
  };


  const deleteReview = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this review?")) return;
    
    try {
      const res = await fetch('/api/reviews', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      
      if (res.ok) {
        setReviews(reviews.filter(r => r.id !== id));
      } else {
        alert("Failed to delete review");
      }
    } catch (err) {
      alert("Failed to delete review");
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ margin: 0, color: '#111827' }}>Customer Reviews</h2>
      </div>

      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>No.</th>
              <th>ID</th>
              <th>Product</th>
              <th>Customer</th>
              <th>Rating</th>
              <th style={{ width: '30%' }}>Review</th>
              <th>Date</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {reviews.map((review, index) => (
              <tr key={review.id}>
                <td>{index + 1}</td>
                <td><span style={{ fontSize: '0.75rem', color: '#6b7280' }}>{review.id}</span></td>
                <td><strong>{review.productName}</strong></td>
                <td>{review.customerName}</td>
                <td>
                  <div style={{ color: '#fbbf24', fontSize: '1rem' }}>
                    {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                  </div>
                </td>
                <td>
                  <p style={{ margin: 0, fontSize: '0.875rem', color: '#374151' }}>{review.comment}</p>
                  {review.photos && review.photos.length > 0 && (
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                      {review.photos.map((photo, idx) => (
                        <img key={idx} src={photo} alt={`Review ${idx}`} style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #e5e7eb' }} />
                      ))}
                    </div>
                  )}
                  {review.reply && (
                    <div style={{ marginTop: '0.5rem', padding: '0.5rem', backgroundColor: '#f3f4f6', borderRadius: '0.25rem', borderLeft: '2px solid #3b82f6' }}>
                      <span style={{ fontSize: '0.7rem', fontWeight: 'bold', color: '#3b82f6' }}>Seller Reply:</span>
                      <p style={{ margin: 0, fontSize: '0.75rem', color: '#4b5563' }}>{review.reply}</p>
                    </div>
                  )}
                </td>
                <td>{new Date((review as any).createdAt || review.date).toLocaleDateString('id-ID')}</td>
                <td>
                  <div style={{ display: 'flex', gap: '0.5rem', flexDirection: 'column' }}>
                    <button 
                      onClick={() => {
                        setReplyingTo(review);
                        setReplyText(review.reply || "");
                      }}
                      style={{
                        padding: '0.25rem 0.5rem',
                        backgroundColor: '#3b82f6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '0.25rem',
                        cursor: 'pointer',
                        fontSize: '0.75rem'
                      }}
                    >
                      💬 Reply
                    </button>

                    <button 
                      onClick={() => deleteReview(review.id)}
                      style={{
                        padding: '0.25rem 0.5rem',
                        backgroundColor: '#dc2626',
                        color: 'white',
                        border: 'none',
                        borderRadius: '0.25rem',
                        cursor: 'pointer',
                        fontSize: '0.75rem'
                      }}
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Reply Modal */}
      {replyingTo && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}>
          <div style={{
            backgroundColor: '#fff', padding: '2rem', borderRadius: '0.5rem', width: '90%', maxWidth: '500px'
          }}>
            <h3 style={{ marginTop: 0 }}>Reply to Review</h3>
            
            <div style={{ marginBottom: '1rem', padding: '1rem', backgroundColor: '#f9fafb', borderRadius: '0.5rem' }}>
              <div style={{ color: '#fbbf24', fontSize: '1rem', marginBottom: '0.5rem' }}>
                {'★'.repeat(replyingTo.rating)}{'☆'.repeat(5 - replyingTo.rating)}
              </div>
              <p style={{ margin: 0, fontSize: '0.875rem', fontStyle: 'italic' }}>&quot;{replyingTo.comment}&quot;</p>
              <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#6b7280' }}>- {replyingTo.customerName}</div>
            </div>

            <textarea 
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Write your official response here..."
              style={{ width: '100%', height: '100px', padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid #d1d5db', resize: 'vertical' }}
            />

            <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem' }}>
              <button 
                onClick={() => setReplyingTo(null)}
                style={{ flex: 1, padding: '0.5rem', backgroundColor: '#e5e7eb', border: 'none', borderRadius: '0.25rem', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button 
                onClick={handleReplySubmit}
                style={{ flex: 1, padding: '0.5rem', backgroundColor: '#111827', color: 'white', border: 'none', borderRadius: '0.25rem', cursor: 'pointer' }}
              >
                Submit Reply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
