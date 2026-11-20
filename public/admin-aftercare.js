const ticketLabels = { open: 'Đã tiếp nhận', reviewing: 'Đang xử lý', resolved: 'Đã giải quyết', rejected: 'Từ chối' };
$('#refresh').insertAdjacentHTML('beforebegin', '<button data-tab="aftercare">Hậu mãi & đánh giá</button>');
$('#dashboard').insertAdjacentHTML('beforeend', '<section id="aftercare" class="card panel" hidden><div class="heading"><h2>Chăm sóc sau mua</h2><button type="button" id="refreshAftercare">Làm mới</button></div><p>Tiếp nhận yêu cầu và phản hồi khách hàng. Trạng thái xử lý không tự chuyển tiền, hoàn kho hoặc tạo vận đơn.</p><div id="supportAdmin"></div><h2>Đánh giá đã mua hàng</h2><p>Ẩn nội dung không phù hợp; việc ẩn không thay đổi đơn mua.</p><div id="reviewsAdmin"></div></section>');
async function loadAftercare() {
  $('#refreshAftercare').disabled = true;
  try {
    const [tickets, reviews] = await Promise.all([api('support'), api('reviews')]);
    $('#supportAdmin').innerHTML = tickets.map(ticket => `<form class="order support-reply" data-ticket-id="${esc(ticket.id)}"><div class="heading"><strong>Đơn #${ticket.orderId} · ${esc(ticket.name)}</strong><span class="badge">${ticket.type === 'return' ? 'Yêu cầu đổi trả' : 'Hỏi về đơn'}</span></div><p>${esc(ticket.message)}</p><label>Trạng thái<select name="status">${Object.entries(ticketLabels).map(([status, label]) => `<option value="${status}" ${ticket.status === status ? 'selected' : ''}>${label}</option>`).join('')}</select></label><label>Phản hồi cho khách<textarea name="reply" maxlength="3000" rows="3">${esc(ticket.reply)}</textarea></label><button type="submit">Lưu phản hồi</button><p class="ticket-feedback" role="status"></p></form>`).join('') || '<p class="empty">Chưa có yêu cầu hỗ trợ.</p>';
    $('#reviewsAdmin').innerHTML = reviews.map(review => `<article class="order"><strong>${esc(review.name)} · SP #${review.productId} · ${review.rating}/5</strong><p>${esc(review.comment)}</p>${(review.images || []).map(image => `<a href="${esc(image)}" target="_blank" rel="noopener"><img class="review-photo" src="${esc(image)}" alt="Ảnh đánh giá" loading="lazy"></a>`).join('')}<p><span class="badge">${review.hidden ? 'Đang ẩn' : 'Công khai'}</span> <button type="button" data-moderate-review="${esc(review.id)}" data-hide="${!review.hidden}">${review.hidden ? 'Hiện đánh giá' : 'Ẩn đánh giá'}</button></p></article>`).join('') || '<p class="empty">Chưa có đánh giá từ khách đã mua.</p>';
  } catch (error) { message(error.message, true); }
  finally { $('#refreshAftercare').disabled = false; }
}
document.querySelector('[data-tab="aftercare"]').onclick = loadAftercare;
$('#refreshAftercare').onclick = loadAftercare;
document.addEventListener('submit', async event => {
  const form = event.target.closest('.support-reply'); if (!form) return;
  event.preventDefault(); const button = form.querySelector('[type=submit]'); if (button.disabled) return; button.disabled = true;
  try { await api('support/' + form.dataset.ticketId, { method: 'PATCH', body: JSON.stringify(Object.fromEntries(new FormData(form))) }); form.querySelector('.ticket-feedback').textContent = 'Đã lưu phản hồi.'; }
  catch (error) { form.querySelector('.ticket-feedback').textContent = error.message; }
  finally { button.disabled = false; }
});
document.addEventListener('click', async event => {
  const button = event.target.closest('[data-moderate-review]'); if (!button || button.disabled) return; button.disabled = true;
  try { await api('reviews/' + button.dataset.moderateReview, { method: 'PATCH', body: JSON.stringify({ hidden: button.dataset.hide === 'true' }) }); await loadAftercare(); }
  catch (error) { message(error.message, true); }
  finally { button.disabled = false; }
});
