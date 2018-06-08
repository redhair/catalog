main();
function main() {
	Catalog.create();
	Cart.create();
}

function showLoader() {
	document.getElementById('loading').style.display = 'flex';
	document.getElementById('loading').style.opacity = '1';
}

function hideLoader() {
	var loader = document.getElementById('loading');
	loader.style.opacity = '0';
	loader.addEventListener('transitionend', function setDisplayHidden() {
		loader.style.display = 'none';
		loader.removeEventListener('transitionend', setDisplayHidden, false);
	}, false);
}