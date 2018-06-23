var Cart = ((d) => {
	'use-strict';

	var _init = false;
	var state = {};
	state.products = [];
	state.totalPrice = 0;

	var $cart_container = d.getElementById('cart');
	var $subtotal_container;
	var $url = 'http://dashboard.allcountyapparel.com/api';

	var checkoutHandler = StripeCheckout.configure({
		key: 'pk_live_8FYfP4advw9MVMoZS11VR5xL',
		image: '',
		locale: 'auto'
	});

	function checkoutButtonOnClick() {
		checkoutHandler.open({
			name: Catalog.state.organization.organization_name.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
			description: '', //put name of product here or cart details
			token: handleToken
		});
	};

	function handleToken(token) {
		showLoader();
		var cart = {
			products: state.products,
			totalPrice: state.totalPrice
		};

		state.shipping_info = getShippingInfoFromPage();
		
		fetch($url + '/order', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				stripe: token,
				cart: cart,
				shipping_info: state.shipping_info
			}),
			mode: 'cors'
		})
		.then(function(res) {
			hideLoader();
			if (!res.ok)
				throw res;

			return res.json();
		})
		.then(function(output) {
			console.log('Purchase succeeded:', output);
			//show confirmation
			Catalog.openOrderScreen(null, output.orderId[0]);
			//reset cart
			state.products = [];
			setProducts();
			renderCart();
		})
		.catch(function(err) {
			console.log('Purchase failure:', err);
			hideLoader();
			Catalog.openOrderScreen(err, null);
		});
	};

	function getShippingInfoFromPage() {
		return {
			first: d.getElementById('first').value,
			last: d.getElementById('last').value,
		    address: {
				line1: d.getElementById('line1').value,
				apartment: d.getElementById('line2').value,
				city: d.getElementById('city').value,
				state: d.getElementById('state').value,
				postal_code: d.getElementById('zip').value
		    }
		}
	}

	function getCustomizationFromPage() {
		var customization = d.getElementById('customization');
		var customizationList = [];

		if (customization.children.length > 0) {
			for (var n = 0; n < customization.children.length; n++) {
				var option = customization.children[n];
				var label = option.children[0].children[0].textContent.trim();
				var value = option.children[1].value;

				if (value) {
					customizationList.push({
						'label': label,
						'value': value
					});
				}
			}
		}

		return customizationList;
	}

	function add(product) {
		var prodCopy = JSON.parse(JSON.stringify(product));
		var variant = d.getElementById('variant').value;
		var size = d.getElementById('size').value;
		var customization = getCustomizationFromPage();

		for (var i = 0; i < state.products.length; i++) {
			var curr = state.products[i];
			if (curr.details.product_id === prodCopy.product_id
			&&  curr.variant === variant
			&&  curr.size === size
			&&  areObjectArraysEqual(curr.customization, customization)) {
				curr.quantity++;
				setProducts();
				renderCart();
				if ($cart_container.style.visibility === 'hidden') {
					showCart();
				}

				return;
			}
		}

		if (customization.length > 0 && !prodCopy.priceChange) {
			for (var i = 0; i < customization.length; i++) {
				prodCopy.price += parseInt(prodCopy.custom_fields[i].price);
				prodCopy.priceChange = true;
			}
		}


		for (var i = 0; i < product.sizes.length; i++) {
			if (product.sizes[i].price
			&&  size === product.sizes[i].label) {
				prodCopy.price += parseInt(product.sizes[i].price);
			}
		}

		state.products.push({
			'details': prodCopy,
			'quantity': 1,
			'size': size,
			'variant': variant,
			'customization': customization
		});

		setProducts();
		renderCart();

		if ($cart_container.style.visibility === 'hidden') {
			showCart();
		}
	}

	function remove(productIndex) {
		state.products.splice(productIndex, 1);

		setProducts();
		renderCart();
	}

	function areObjectArraysEqual(a, b) {
	  if (a === b) return true;
	  if (a == null || b == null) return false;
	  if (a.length != b.length) return false;

	  var as = JSON.stringify({a: a});
	  var bs = JSON.stringify({a: b});

	  if (as !== bs) return false;

	  var ap = Object.getOwnPropertyNames(a).sort();
	  var bp = Object.getOwnPropertyNames(b).sort();

	  for (var i = 0; i < a.length; i++) {
	    if (ap[i] !== bp[i]) return false;
	  }

	  return true;
	}

	function setProducts() {
		localStorage.setItem('products', JSON.stringify(state.products));
	}

	function getProducts() {
		return localStorage.getItem('products') ? JSON.parse(localStorage.getItem('products')) : [];
	}

	function showCart() {
		$cart_container.style.visibility = 'visible';
		$cart_container.style.right = '0px';
		$subtotal_container.style.right = '0px';
	}

	function hideCart() {
		$cart_container.style.right = '-' + $cart_container.offsetWidth.toString() + 'px';
		$subtotal_container.style.right = '-' + $subtotal_container.offsetWidth.toString() + 'px';
		$cart_container.addEventListener('transitionend', function setVisibilityHidden() {
			$cart_container.style.visibility = 'hidden';
			$cart_container.removeEventListener('transitionend', setVisibilityHidden, false);
		}, false);
	}

	function renderCart() {
		if (_init)
			d.getElementById('cart').innerHTML = '';

		var cartItemContainer = d.createElement('div');
		cartItemContainer.className = 'cartItemContainer';
		for (var p in state.products) {
			var product = state.products[p];
			var item = d.createElement('div');
			item.className = 'cartItem col-xs row';
			var itemTemplate = `
				<img src="${product.details.images[getVariantImageIndex(product.variant, product.details)] ? product.details.images[getVariantImageIndex(product.variant, product.details)].image_url : undefined}" width=85>
				<div class="cartItem__info">
					<h4>${product.details.product_name}</h4>
					<span>Quantity:&nbsp;${product.quantity}</span>
					<span>Color:&nbsp;${product.variant}</span>
					<span>Size:&nbsp;${product.size}</span>
					${product.customization.length > 0 ? product.customization.map(a => `<span>${a.label}&nbsp;${a.value}</span>`.trim()).join('') : ``}
				</div>
				<span>$${product.details.price}</span>
				<i onclick="Cart.remove(${p})" class="fa fa-close clickable"></i>
			`;

			item.innerHTML = itemTemplate;
			cartItemContainer.appendChild(item);
		}
		$cart_container.appendChild(cartItemContainer);

		var total = d.createElement('div');
		total.id = 'total';
		total.className = 'subtotalContainer';
		state.totalPrice = getTotal();
		total.innerHTML = '<h4>Subtotal:&nbsp;$' + state.totalPrice + '</h4>' + '<button onclick="Catalog.openCheckout()" class="btn btn--checkout">Checkout</button><a style="font-size: 14px;" class="clickable" onclick="Cart.hideCart()">Close Cart</a>';
		$cart_container.appendChild(total);
		$subtotal_container = d.getElementById('total');
		$subtotal_container.style.right = '-' + $subtotal_container.offsetWidth.toString() + 'px';

		d.getElementById('cart_icon').onclick = toggleCart;
		d.getElementById('cart_amount').innerHTML = getQuantityOfCart();
	}

	function toggleCart() {
		if ($cart_container.style.visibility == 'hidden') {
			showCart();
		} else {
			hideCart();
		}
	}

	function isCartEmpty() {
		return state.products.length === 0;
	}

	function getTotal() {
		//todo, don't recalculate it each time, read it, then add to it
		return state.products.map(p => p.details.price * p.quantity).reduce((a, b) => a + b, 0).toFixed(2);
	}

	function getQuantityOfCart() {
		return state.products.map(p => p.quantity).reduce((a, b) => a + b, 0);
	}

	function getVariantImageIndex(variant, product) {
		var images = product.images;
		for (var i = 0; i < images.length; i++) {
			var associations = images[i].associations;
			for (var j = 0; j < associations.length; j++) {
				if (associations[j].label === variant
				&&  associations[j].checked) {
					return i;
				}
			}
		}

		return false;
	}

	function create() {
		if (_init)
			return;

		state.products = getProducts();
		renderCart();
		$cart_container.style.right = '-' + $cart_container.offsetWidth.toString() + 'px';

		_init = true;
	}

	return {
		getProducts: getProducts,
		create: create,
		add: add,
		isCartEmpty: isCartEmpty,
		remove: remove,
		showCart: showCart,
		hideCart: hideCart,
		checkoutButtonOnClick: checkoutButtonOnClick
	};
})(document);