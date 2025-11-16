// === إعداد Supabase ===
const SUPABASE_URL = "https://vdfjwxvdnadqqglbsbev.supabase.co";        
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZkZmp3eHZkbmFkcXFnbGJzYmV2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMyOTg0NDAsImV4cCI6MjA3ODg3NDQ0MH0.pHSlKDsPG0ZR1XbeDJqNPBixaIaezZ6YBxXmPzl9w_8";

const { createClient } = supabase;
const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const shopPhone = "962787548772";

let products = [];

const productsGrid       = document.getElementById("productsGrid");
const productSelect      = document.getElementById("productSelect");
const sizeSelect         = document.getElementById("sizeSelect");
const colorSelect        = document.getElementById("colorSelect");
const currentProductText = document.getElementById("currentProductText");

const customerName       = document.getElementById("customerName");
const customerPhone      = document.getElementById("customerPhone");
const customerNote       = document.getElementById("customerNote");
const customerLocation   = document.getElementById("customerLocation");

const clearFormBtn       = document.getElementById("clearFormBtn");
const sendOrderBtn       = document.getElementById("sendOrderBtn");

function parseList(text) {
  if (!text) return [];
  return text.split(",").map(s => s.trim()).filter(Boolean);
}

function renderProducts() {
  productsGrid.innerHTML = "";
  products.forEach((p) => {
    const card = document.createElement("div");
    card.className = "product-card";

    card.innerHTML = `
      <div>
        <div class="product-image">
          ${p.image_url ? `<img src="${p.image_url}" alt="${p.name}" />` : "صورة الشنطة"}
        </div>
        <div class="product-title">${p.name}</div>
        <div class="product-price">${p.price}</div>
        <div class="product-meta">
          مقاسات: ${p.sizes.join("، ")}<br/>
          ألوان: ${p.colors.join("، ")}
        </div>
      </div>
      <button type="button" data-id="${p.id}">اطلب هذه الشنطة</button>
    `;

    card.querySelector("button").addEventListener("click", () => {
      setCurrentProduct(p.id);
      window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
    });

    productsGrid.appendChild(card);
  });

  populateProductSelect();
}

function populateProductSelect() {
  productSelect.innerHTML = "";
  products.forEach((p) => {
    const opt = document.createElement("option");
    opt.value = p.id;
    opt.textContent = p.name;
    productSelect.appendChild(opt);
  });

  if (products.length > 0) {
    setCurrentProduct(products[0].id, false);
  } else {
    currentProductText.textContent = "لا يوجد منتجات متاحة حالياً.";
  }
}

function updateSizeAndColorOptions(product) {
  sizeSelect.innerHTML = "";
  product.sizes.forEach(size => {
    const opt = document.createElement("option");
    opt.value = size;
    opt.textContent = size;
    sizeSelect.appendChild(opt);
  });

  colorSelect.innerHTML = "";
  product.colors.forEach(color => {
    const opt = document.createElement("option");
    opt.value = color;
    opt.textContent = color;
    colorSelect.appendChild(opt);
  });
}

function setCurrentProduct(productId, updateSelect = true) {
  const product = products.find(p => p.id === productId);
  if (!product) return;

  if (updateSelect) productSelect.value = product.id;
  updateSizeAndColorOptions(product);
  currentProductText.innerHTML =
    `الطلب الحالي على: <span>${product.name}</span> - السعر: <span>${product.price}</span>`;
}

productSelect.addEventListener("change", (e) => {
  setCurrentProduct(e.target.value, false);
});

clearFormBtn.addEventListener("click", () => {
  customerName.value = "";
  customerPhone.value = "";
  customerNote.value = "";
});

function fetchCustomerLocation() {
  if (!navigator.geolocation) {
    customerLocation.value = "المتصفح لا يدعم تحديد الموقع";
    return;
  }
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const lat = pos.coords.latitude.toFixed(5);
      const lon = pos.coords.longitude.toFixed(5);
      customerLocation.value = `https://www.google.com/maps?q=${lat},${lon}`;
    },
    () => {
      customerLocation.value = "لم يتم السماح بمشاركة الموقع";
    }
  );
}

sendOrderBtn.addEventListener("click", () => {
  const product = products.find(p => p.id === productSelect.value);
  if (!product) {
    alert("رجاءً اختاري شنطة.");
    return;
  }

  const size     = sizeSelect.value;
  const color    = colorSelect.value;
  const name     = customerName.value.trim();
  const phone    = customerPhone.value.trim();
  const note     = customerNote.value.trim();
  const location = customerLocation.value || "غير محدد";

  if (!name || !phone) {
    alert("رجاءً أدخلي اسمك ورقم الجوال قبل إرسال الطلب.");
    return;
  }

  const message = `
طلب جديد من موقع الشناتي النسائية:

الشنطة: ${product.name}
المقاس: ${size}
اللون: ${color}

اسم الزبونة: ${name}
رقم الجوال: ${phone}
ملاحظات إضافية: ${note || "لا يوجد"}
موقع الزبونة: ${location}

رجاءً التواصل مع الزبونة لتأكيد الطلب والتسليم.
  `.trim();

  const url = `https://api.whatsapp.com/send?phone=${shopPhone}&text=${encodeURIComponent(message)}`;
  window.open(url, "_blank");
});

async function loadProducts() {
  const { data, error } = await sb
    .from("products")
    .select("*")
    .eq("active", true)
    .order("name", { ascending: true });

  if (error) {
    console.error(error);
    currentProductText.textContent = "حدث خطأ في تحميل المنتجات.";
    return;
  }

  products = (data || []).map(p => ({
    ...p,
    sizes: parseList(p.sizes),
    colors: parseList(p.colors)
  }));

  renderProducts();
}

// تشغيل عند التحميل
loadProducts();
fetchCustomerLocation();
