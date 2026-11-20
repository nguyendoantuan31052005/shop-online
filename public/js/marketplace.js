// Shortcuts use the same filters and sorting as the catalog sidebar.
function syncMarketplaceControls() {
  document.querySelectorAll('[data-market-sort]').forEach(button => {
    button.setAttribute('aria-pressed', String(button.dataset.marketSort === sortMode));
  });
  const min = document.getElementById('minPrice').value;
  const max = document.getElementById('maxPrice').value;
  document.querySelectorAll('[data-budget]').forEach(button => {
    const [low, high] = button.dataset.budget.split(':');
    button.setAttribute('aria-pressed', String(min !== '' && Number(min) === Number(low) && max === high));
  });
}
document.querySelector('.market-toolbar').addEventListener('click', event => {
  const sort = event.target.closest('[data-market-sort]');
  if (sort) {
    sortSelect.value = sort.dataset.marketSort;
    sortSelect.dispatchEvent(new Event('change'));
  }
  const budget = event.target.closest('[data-budget]');
  if (budget) {
    const selected = budget.getAttribute('aria-pressed') === 'true';
    const [min, max] = selected ? ['', ''] : budget.dataset.budget.split(':');
    document.getElementById('minPrice').value = min;
    document.getElementById('maxPrice').value = max;
    document.getElementById('minPrice').dispatchEvent(new Event('input'));
  }
});
syncMarketplaceControls();
