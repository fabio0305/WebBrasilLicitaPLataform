/* ================================================================
   PAINEL – Script
   ================================================================ */

const sidebar        = document.getElementById('sidebar');
const overlay        = document.getElementById('sidebarOverlay');
const toggleBtn      = document.getElementById('sidebarToggle');
const closeBtn       = document.getElementById('sidebarClose');

function openSidebar() {
  sidebar.classList.add('open');
  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeSidebar() {
  sidebar.classList.remove('open');
  overlay.classList.remove('open');
  document.body.style.overflow = '';
}

if (toggleBtn) toggleBtn.addEventListener('click', openSidebar);
if (closeBtn)  closeBtn.addEventListener('click', closeSidebar);
if (overlay)   overlay.addEventListener('click', closeSidebar);

window.addEventListener('resize', () => {
  if (window.innerWidth > 768) closeSidebar();
});
