import jsonServer from 'json-server';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { VNPay, ProductCode, VnpLocale } from 'vnpay';
import express from 'express';

const server = jsonServer.create();
const router = jsonServer.router('mock/db.json'); // dữ liệu JSON
const middlewares = jsonServer.defaults();


const VNPAY_TMNCODE = process.env.VNPAY_TMNCODE || 'mock_tmn';
const VNPAY_HASH_SECRET = process.env.VNPAY_HASH_SECRET || 'mock_secret';
const VNPAY_URL = process.env.VNPAY_URL || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';
const VNPAY_RETURN_URL = process.env.VNPAY_RETURN_URL || 'http://localhost:4000/api/course/vnpay-return';

// ============ Enable CORS ============
server.use((req, res, next) => {
  const origin = req.headers.origin || 'http://localhost:3000';
  res.header('Access-Control-Allow-Origin', origin);
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  console.debug('[mock] incoming', req.method, req.url, 'Cookie=', req.headers.cookie || '-', 'Content-Type=', req.headers['content-type'] || '-');
  next();
});

// ============ Chuẩn hoá URL ảnh trả về từ mock ============
const PLACEHOLDERS = [
  '/assets/images/thumbs/product-two-img1.png',
  '/assets/images/thumbs/product-two-img2.png',
  '/assets/images/thumbs/product-two-img3.png',
  '/assets/images/thumbs/product-two-img4.png',
  '/assets/images/thumbs/product-two-img5.png',
  '/assets/images/thumbs/product-two-img6.png',
  '/assets/images/thumbs/product-two-img7.png',
];

function normalizeImg(src, i = 0) {
  if (typeof src !== 'string' || !src.trim()) return PLACEHOLDERS[i % PLACEHOLDERS.length];
  const s = src.trim();
  // Cho phép URL hợp lệ và path bắt đầu bằng '/'
  if (/^https?:\/\//i.test(s)) {
    // chặn domain ví dụ không tồn tại
    if (/^https?:\/\/example\.com\//i.test(s)) {
      return PLACEHOLDERS[i % PLACEHOLDERS.length];
    }
    return s;
  }
  if (s.startsWith('/')) return s; // đã là ảnh trong public
  // tên file trần -> dùng placeholder có sẵn trong public
  return PLACEHOLDERS[i % PLACEHOLDERS.length];
}

function normalizeDeep(data, idxRef = { i: 0 }) {
  if (Array.isArray(data)) {
    return data.map((v) => normalizeDeep(v, idxRef));
  }
  if (data && typeof data === 'object') {
    const out = Array.isArray(data) ? [] : {};
    for (const [k, v] of Object.entries(data)) {
      if (k === 'mediaurl' || k === 'image_url' || k === 'media' || k === 'icon_url') {
        out[k] = normalizeImg(v, idxRef.i++);
      } else {
        out[k] = normalizeDeep(v, idxRef);
      }
    }
    return out;
  }
  return data;
}

// Middleware: bọc res.json để tự động normalize ảnh trong mọi response
server.use((req, res, next) => {
  const origJson = res.json.bind(res);
  res.json = (data) => origJson(normalizeDeep(data));
  next();
});

// ===== Single product endpoint for FE detail fetch =====
server.get('/api/sanphams/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!Number.isFinite(id)) return res.status(400).json({ status: false, message: 'Bad id' });
  // Try to find in db.json collections if present
  const all1 = router.db.get('api_sanphams_selection_best_products').value?.() || [];
  const all2 = router.db.get('api_sanphams_selection_hot_sales').value?.() || [];
  const all3 = router.db.get('api_sanphams_selection_recommend').value?.() || [];
  const all = ([]).concat(all1 || [], all2 || [], all3 || []);
  const found = Array.isArray(all) ? all.find(p => Number(p?.id) === id) : null;
  if (found) return res.json({ status: true, data: normalizeDeep(found) });

  // Fallback stub
  const base = productStub(id);
  // Generate a simple price pattern for demo: odd id free, even id discounted
  const price = id % 2 === 0 ? 350000 : 0;
  const original = price > 0 ? price + 50000 : null;
  const data = {
    id,
    slug: `sp-${id}`,
    ten: base.ten,
    mediaurl: base.mediaurl,
    selling_price: price,
    original_price: original,
    gia: { current: price, before_discount: original },
  };
  return res.json({ status: true, data });
});

// map /api/... -> resource trong db.json
const rewriter = jsonServer.rewriter({
  '/api/tai-khoan/yeuthichs*': '/yeuthichs',
  '/api/bannerquangcaos*': '/bannerquangcaos',
  '/api/danhmucs-selection*': '/danhmucs_selection',
  '/api/sanphams-selection?selection=best_products*': '/api_sanphams_selection_best_products',
  '/api/sanphams-selection?selection=top_categories*': '/api_sanphams_selection_top_categories',
  '/api/sanphams-selection?selection=hot_sales*': '/api_sanphams_selection_hot_sales',
  '/api/sanphams-selection?selection=recommend*': '/api_sanphams_selection_recommend'
});




// ===== Helpers for a simple cookie-based mock session =====
const COOKIE_NAME = 'x-user-id';
function parseCookies(req) {
  const raw = req.headers?.cookie || '';
  return Object.fromEntries(
    raw.split(';').map(s => s.trim()).filter(Boolean).map(p => {
      const i = p.indexOf('=');
      if (i === -1) return [p, ''];
      return [decodeURIComponent(p.slice(0, i)), decodeURIComponent(p.slice(i + 1))];
    })
  );
}
function getUserIdFromCookie(req) {
  // Ưu tiên đọc từ Authorization header (Bearer token)
  const authHeader = req.headers.authorization || '';
  if (authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    // Token format: "userId:timestamp" 
    const userId = token.split(':')[0];
    if (userId && userId !== 'mock' && userId !== 'token' && userId !== 'value') {
      return String(userId);
    }
  }

  // Fallback: đọc từ cookie
  const c = parseCookies(req);
  const v = c[COOKIE_NAME];
  return v ? String(v) : null;
}

function requireOrInitUser(req, res) {
  let uid = getUserIdFromCookie(req);
  if (!uid) {
    uid = `guest:${Date.now().toString(36)}:${Math.random().toString(36).slice(2, 8)}`;
    setUserCookie(res, uid); // tái dùng cookie có sẵn
  }
  return String(uid);
}

function setUserCookie(res, userId) {
  const expires = new Date(Date.now() + 7 * 24 * 3600 * 1000).toUTCString();
  // Bỏ hoàn toàn SameSite để browser tự xử lý (default behavior cho localhost)
  res.setHeader('Set-Cookie', `${COOKIE_NAME}=${encodeURIComponent(String(userId))}; Path=/; Expires=${expires}`);
}
function clearUserCookie(res) {
  res.setHeader('Set-Cookie', `${COOKIE_NAME}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT`);
}

// Simple product stub builder for enrichment
function productStub(id) {
  const num = parseInt(String(id), 10) || 0;
  return {
    id: num,
    ten: `Sản phẩm #${num}`,
    mediaurl: normalizeImg(`/assets/images/thumbs/product-two-img${(num % PLACEHOLDERS.length) + 1}.png`, num),
    gia: { current: 0, before_discount: null, discount_percent: 0 },
    store: { name: 'Mock Store', icon_url: null },
    rating: { average: 0, count: 0 }
  };
}

server.use((req, res, next) => {
  if (!req.body || typeof req.body !== "object") return next();

  const b = { ...req.body };

  // map phổ biến (VN -> english/alias)
  if (typeof b.hoten === "string" && !b.name) b.name = b.hoten;
  if (typeof b.sodienthoai === "string" && !b.phone) b.phone = b.sodienthoai;
  // client có thể gửi email (form) nhưng backend thực tế ghi email trong profile sau này
  // vẫn giữ nếu có
  if (typeof b.email === "string" && !b.email) b.email = b.email;
  // password confirmation alias
  if (typeof b.password_confirmation === "string" && !b.passwordConfirm) b.passwordConfirm = b.password_confirmation;

  // order / checkout aliases
  if (b.thanhtien != null && b.amount == null) b.amount = b.thanhtien;
  if (b.madon && !b.orderId) b.orderId = b.madon;

  req.body = b;
  next();
});

// Mock endpoints cho AUTH để FE có thể đăng ký/đăng nhập
server.post('/auth/register', (req, res) => {
  const { name, email, phone, password, confirmPassword } = req.body || {};
  if (!name || !email || !phone || !password || !confirmPassword) {
    return res.status(400).json({ message: 'Thiếu thông tin đăng ký' });
  }
  if (password !== confirmPassword) {
    return res.status(400).json({ message: 'Hai mật khẩu không trùng khớp' });
  }
  // Lưu user vào db.json qua lowdb của json-server
  const users = router.db.get('users');
  const exists = users.find({ email }).value();
  if (exists) return res.status(409).json({ message: 'Email đã tồn tại' });

  const newUser = { id: Date.now(), name, email, phone, password };
  users.push(newUser).write();
  return res.status(200).json({ message: 'Đăng ký thành công', user: newUser });
});

server.post('/auth/dang-nhap', (req, res) => {
  const { identifier, password } = req.body || {};
  if (!identifier || !password) {
    return res.status(400).json({ message: 'Thiếu thông tin đăng nhập' });
  }
  const id = String(identifier).trim();
  const users = router.db.get('users').value();
  const user = users.find(u => ((u.email === id) || (u.phone === id) || (u.name === id)) && u.password === password);
  if (!user) return res.status(401).json({ message: 'Sai thông tin đăng nhập' });
  return res.status(200).json({ token: 'mock.token.value', user: { id: user.id, name: user.name, email: user.email, phone: user.phone } });
});

// ===== Vietnamese auth aliases used by the FE =====
server.post('/api/v1/dang-ky', (req, res) => {
  try {
    const payload = req.body || {};

    // ensure users collection exists
    if (!router.db.has('users').value()) router.db.set('users', []).write();
    const users = router.db.get('users');

    // create user record: keep fields in VN but store common keys for compatibility
    const id = Date.now();
    const user = {
      id,
      name: payload.name || payload.hoten || '',
      username: payload.username || `user${id}`,
      email: payload.email || null, // backend real may ignore; keep for mock
      phone: payload.phone || payload.sodienthoai || null,
      // do not store plain password in real apps; this is mock only
      password: payload.password ? String(payload.password) : null,
      created_at: new Date().toISOString(),
    };

    users.push(user).write();

    // respond in shape front-end expects
    return res.json({
      success: true,
      message: 'Đăng ký thành công (mock)',
      token: null,
      data: { id: user.id, username: user.username, name: user.name }
    });
  } catch (err) {
    console.error('[mock] /api/v1/dang-ky error', err);
    return res.status(500).json({ success: false, message: 'Lỗi mock khi đăng ký' });
  }
});

server.post('/api/v1/dang-nhap', (req, res) => {
  const { identifier, password } = req.body || {};
  if (!identifier || !password) return res.status(400).json({ message: 'Thiếu thông tin đăng nhập' });
  const id = String(identifier).trim();
  const users = router.db.get('users').value();
  const user = users.find(u => ((u.email === id) || (u.phone === id) || (u.name === id)) && u.password === password);
  if (!user) return res.status(401).json({ message: 'Sai thông tin đăng nhập' });

  // Tạo token chứa userId (format: userId:timestamp)
  const token = `${user.id}:${Date.now()}`;
  setUserCookie(res, user.id); // Vẫn set cookie cho tương thích

  return res.status(200).json({
    token,
    user: { id: user.id, name: user.name, email: user.email, phone: user.phone || '' }
  });
});

server.post('/api/v1/dang-xuat', (req, res) => {
  clearUserCookie(res);
  return res.status(200).json({ status: true });
});

server.get('/api/toi/giohang', (req, res) => {
  const uid = requireOrInitUser(req, res); // đảm bảo có guest-id khi chưa đăng nhập
  const v = String(req.query?.v || '').toLowerCase();

  const rows = router.db.get('giohangs').filter({ user_id: String(uid) }).value();

  // 1) Enrich theo shape FE (mặc định)
  const feItems = rows.map(r => {
    const p = productStub(r.id_bienthesp);
    const current = Number(p?.gia?.current ?? 0);
    const before = Number(p?.gia?.before_discount ?? 0) || current;
    return {
      ...r,
      product: {
        ...p,
        gia: { current, before_discount: before }
      }
    };
  });

  // 2) Tính totals 1 lần dùng chung cho cả FE/docx
  const totals = feItems.reduce((acc, it) => {
    const price = Number(it.product?.gia?.current ?? 0);
    const origin = Number(it.product?.gia?.before_discount ?? price);
    const qty = Number(it.quantity ?? 0);
    acc.subtotal += price * qty;
    if (origin > price) acc.discount += (origin - price) * qty;
    return acc;
  }, { subtotal: 0, discount: 0 });
  const total = Math.max(0, totals.subtotal);

  // 3) Nếu không yêu cầu docx => giữ nguyên FE (back-compat)
  if (v !== 'docx') {
    return res.status(200).json({
      status: true,
      data: feItems,
      totals: { ...totals, total }
    });
  }

  // 4) Map sang shape docx khi ?v=docx
  const docxItems = feItems.map(it => {
    const p = it.product;
    const qty = Number(it.quantity ?? 0);
    const price = Number(p?.gia?.current ?? 0);
    const origin = Number(p?.gia?.before_discount ?? price);
    const tamtinh = price * qty;
    const giam = origin > price ? Math.round((origin - price) / origin * 100) : 0;

    return {
      id_giohang: it.id,
      id_nguoidung: String(uid),
      trangthai: 'Hiển thị',
      bienthe: {
        soluong: qty,
        giagoc: origin,
        thanhtien: tamtinh,
        tamtinh: tamtinh,
        detail: {
          thuonghieu: p?.store?.name ?? 'Mock Store',
          tensanpham: p?.ten ?? `Sản phẩm #${p?.id ?? ''}`,
          loaisanpham: p?.category ?? null,
          giamgia: `${giam}%`,
          giagoc: origin,
          giaban: price,
          // nếu bạn chỉ cần tên file như docx mô tả:
          hinhanh: (p?.mediaurl || '').split('/').pop() || null
        }
      }
    };
  });

  return res.status(200).json({
    status: true,
    message: 'Danh sách sản phẩm trong giỏ hàng',
    data: docxItems,
    totals: { ...totals, total }
  });
});

// POST
server.post('/api/toi/giohang', (req, res) => {
  const uid = requireOrInitUser(req, res);
  const { id_bienthesp, quantity } = req.body || {};
  if (!id_bienthesp) return res.status(400).json({ message: 'Thiếu id_bienthesp' });
  const vid = String(id_bienthesp);               // CHUẨN HÓA kiểu
  const q = Math.max(1, Number(quantity) || 1);
  const col = router.db.get('giohangs');
  const existed = col.find({ user_id: String(uid), id_bienthesp: vid }).value();
  if (existed) {
    const newQ = (Number(existed.quantity) || 0) + q;
    col.find({ id: existed.id }).assign({ quantity: newQ }).write();
    return res.status(200).json({ status: true, data: { ...existed, quantity: newQ } });
  }
  const row = { id: Date.now(), user_id: String(uid), id_bienthesp: vid, quantity: q };
  col.push(row).write();
  return res.status(201).json({ status: true, data: row });
});

// PUT
server.put('/api/toi/giohang/:id_bienthesp', (req, res) => {
  const uid = requireOrInitUser(req, res);
  const vid = String(req.params?.id_bienthesp);
  const q = Math.max(0, Number((req.body || {}).quantity) || 0);
  const col = router.db.get('giohangs');
  const existed = col.find({ user_id: String(uid), id_bienthesp: vid }).value();
  if (!existed) return res.status(404).json({ message: 'Không tìm thấy item' });
  if (q === 0) {
    col.remove({ id: existed.id }).write();
    return res.status(200).json({ status: true });
  }
  col.find({ id: existed.id }).assign({ quantity: q }).write();
  return res.status(200).json({ status: true, data: { ...existed, quantity: q } });
});

// DELETE
server.delete('/api/toi/giohang/:id_bienthesp', (req, res) => {
  const uid = requireOrInitUser(req, res);
  const vid = String(req.params?.id_bienthesp);
  const col = router.db.get('giohangs');
  const existed = col.find({ user_id: String(uid), id_bienthesp: vid }).value();
  if (!existed) return res.status(404).json({ message: 'Không tìm thấy item' });
  col.remove({ id: existed.id }).write();
  return res.status(200).json({ status: true });
});


function resolveUserIdFromReq(req) {
  // try cookie / bearer parsing existing helper
  const fromCookie = getUserIdFromCookie(req);
  if (fromCookie) return String(fromCookie);

  // try Authorization header or query param
  const rawAuth = String(req.headers.authorization || req.query?.user_id || '').trim();
  if (rawAuth) {
    let token = rawAuth.replace(/^Bearer\s+/i, '');
    // token like "123:timestamp"
    if (token.includes(':')) token = token.split(':')[0];
    if (/^\d+$/.test(token)) return token;
    // support the mock.token.value by picking first user as dev fallback
    if (token === 'mock.token.value' || token === 'mock.token') {
      const firstUser = router.db.get('users').value()?.[0];
      if (firstUser && firstUser.id != null) return String(firstUser.id);
    }
  }

  return null;
}
// ===== Profile endpoints (improved) =====
server.get('/api/v1/thong-tin-ca-nhan', (req, res) => {
  const uid = resolveUserIdFromReq(req);
  if (!uid) return res.status(401).json({ message: 'Chưa đăng nhập (mock). Gửi cookie hoặc Authorization: Bearer <userId:ts>' });

  // ensure profiles collection exists
  if (!router.db.has('profiles').value()) router.db.set('profiles', []).write();

  const profiles = router.db.get('profiles');
  let pf = profiles.find({ user_id: uid }).value();
  if (!pf) {
    const user = router.db.get('users').find({ id: Number(uid) }).value() || {};
    pf = {
      id: Date.now(),
      user_id: uid,
      name: user.name || '',
      gender: 'unknown',
      birthday: null,
      email: user.email || '',
      nationality: 'VN',
      phone: user.phone || ''
    };
    profiles.push(pf).write();
  }
  return res.json({ status: true, data: pf });
});

server.use((req, res, next) => {
  console.debug('[mock] incoming', req.method, req.url, 'Cookie=', req.headers.cookie || '-', 'Content-Type=', req.headers['content-type'] || '-');
  next();
});

const UPLOAD_DIR = path.join(process.cwd(), 'mock', 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '';
    const name = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
    cb(null, name);
  }
});

const upload = multer({ storage });

server.put('/api/v1/thong-tin-ca-nhan', upload.single('avatar'), (req, res) => {
  try {
    console.debug('[mock] PUT /api/v1/thong-tin-ca-nhan content-type=', req.headers['content-type']);
    console.debug('[mock] PUT /api/v1/thong-tin-ca-nhan req.file =', req.file);
    console.debug('[mock] PUT /api/v1/thong-tin-ca-nhan req.body keys =', Object.keys(req.body || {}));

    // resolve uid consistently (use existing helper)
    const uid = resolveUserIdFromReq(req) || (req.headers['x-user-id'] ? String(req.headers['x-user-id']) : null);
    if (!uid) {
      if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return res.status(401).json({ status: false, message: 'Unauthorized (mock)' });
    }

    // ensure profiles collection exists
    if (!router.db.has('profiles').value()) router.db.set('profiles', []).write();
    const profiles = router.db.get('profiles');
    // Build updates from multipart fields (req.body contains strings)
    const src = req.body || {};
    const updates = {};
    if (typeof src.name === 'string') updates.name = src.name;
    if (typeof src.gender === 'string') updates.gender = src.gender;
    if (typeof src.birthday === 'string') updates.birthday = src.birthday;
    if (typeof src.email === 'string') updates.email = src.email;
    if (typeof src.nationality === 'string') updates.nationality = src.nationality;
    if (typeof src.phone === 'string') updates.phone = src.phone;
    if (typeof src.address_street === 'string') updates.address_street = src.address_street;
    if (typeof src.address_district === 'string') updates.address_district = src.address_district;
    if (typeof src.address_city === 'string') updates.address_city = src.address_city;
    if (typeof src.address_postal === 'string') updates.address_postal = src.address_postal;

    // If multer saved a file, set public avatar URL
    if (req.file && req.file.filename) {
      updates.avatar = `/uploads/${req.file.filename}`;
      console.debug('[mock] avatar saved at', req.file.path, 'public ->', updates.avatar);
    }
    // find existing profile or create default
    let pf = profiles.find({ user_id: String(uid) }).value();
    if (!pf) {
      // try to seed from users collection
      const user = router.db.get('users').find({ id: Number(uid) }).value() || {};
      pf = {
        id: Date.now(),
        user_id: String(uid),
        name: user.name || '',
        gender: 'unknown',
        birthday: null,
        email: user.email || '',
        nationality: 'VN',
        phone: user.phone || '',
      };
      profiles.push(pf).write();
    }

    // Only assign keys present in updates (do not wipe others)
    if (Object.keys(updates).length) {
      profiles.find({ id: pf.id }).assign({ ...updates, updated_at: new Date().toISOString() }).write();
    }

    const after = profiles.find({ id: pf.id }).value();
    console.debug('[mock] profile updated', after);

    return res.json({ status: true, data: after });
  } catch (err) {
    console.error('[mock] error in PUT /api/v1/thong-tin-ca-nhan', err);
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    return res.status(500).json({ status: false, message: 'Internal mock error' });
  }
});

// ===== Wishlist theo người dùng =====
server.get('/api/tai-khoan/yeuthichs', (req, res) => {
  const uid = getUserIdFromCookie(req);
  if (uid) {
    const rows = router.db.get('yeuthichs_user').filter({ user_id: String(uid) }).value();
    const data = rows.map(r => ({ ...r, product: productStub(r.product_id) }));
    return res.json({ status: true, data });
  }
  // chưa đăng nhập: trả dữ liệu chung (demo)
  const rows = router.db.get('yeuthichs').value();
  const data = rows.map(r => ({ ...r, product: productStub(r.product_id || r.id) }));
  return res.json({ status: true, data });
});

server.post('/api/tai-khoan/yeuthichs', (req, res) => {
  const uid = getUserIdFromCookie(req);
  if (!uid) return res.status(401).json({ message: 'Chưa đăng nhập' });
  const { product_id } = req.body || {};
  if (!product_id) return res.status(400).json({ message: 'Thiếu product_id' });
  const col = router.db.get('yeuthichs_user');
  const existed = col.find({ user_id: String(uid), product_id }).value();
  if (existed) return res.json({ status: true, data: existed });
  const row = { id: Date.now(), user_id: String(uid), product_id };
  col.push(row).write();
  return res.status(201).json({ status: true, data: row });
});

server.delete('/api/tai-khoan/yeuthichs/:product_id', (req, res) => {
  const uid = getUserIdFromCookie(req);
  if (!uid) return res.status(401).json({ message: 'Chưa đăng nhập' });
  const pid = parseInt(req.params.product_id, 10);
  const col = router.db.get('yeuthichs_user');
  const existed = col.find({ user_id: String(uid), product_id: pid }).value();
  if (!existed) return res.status(404).json({ message: 'Không tìm thấy' });
  col.remove({ id: existed.id }).write();
  return res.json({ status: true });
});

// ===== Orders endpoints =====
// Ensure helper resolveUserIdFromReq exists in this file; reuse if defined above.
function safeResolveUserId(req) {
  try {
    return typeof resolveUserIdFromReq === 'function' ? resolveUserIdFromReq(req) : (req.headers['x-mock-user'] || null);
  } catch (e) {
    return null;
  }
}

// ensure orders collection exists
if (!router.db.has('orders').value()) router.db.set('orders', []).write();

// Create order handler — accepts POST /api/toi/donhang and POST /api/tai-khoan/donhangs
server.post(['/api/toi/donhang', '/api/tai-khoan/donhangs'], (req, res) => {
  try {
    const uid = safeResolveUserId(req) || (req.body && req.body.user_id) || null;
    const payload = req.body || {};
    const cart = Array.isArray(payload.cart) ? payload.cart : (Array.isArray(payload.items) ? payload.items : []);
    const amount = Number(payload.amount ?? payload.total ?? payload.amount_paid ?? 0) || 0;
    const paymentMethod = String(payload.paymentMethod ?? payload.payment_method ?? payload.method ?? 'cod');

    const generateMadon = () => {
      // 9 digit random
      const digits = Math.floor(100000000 + Math.random() * 900000000);
      return `VINA${digits}`;
    };
    // Build chitietdonhang[] according to frontend schema
    const chitiet = (Array.isArray(cart) ? cart : []).map((it) => {
      const prod = it.product || {};
      return {
        id: it.id ?? it.id_bienthesp ?? (prod.id || null),
        soluong: Number(it.quantity ?? it.qty ?? 1),
        dongia: Number(it.price ?? it.gia?.current ?? prod.gia?.current ?? prod.selling_price ?? 0),
        bienthe: {
          sanpham: {
            ten: prod.ten ?? prod.name ?? it.name ?? `Sản phẩm ${prod.id ?? ''}`,
            hinhanh: (prod.mediaurl || prod.hinhanh || (prod.image && String(prod.image))) || "/assets/images/thumbs/default.png"
          }
        }
      };
    });

    // Ensure orders collection exists
    if (!router.db.has('orders').value()) router.db.set('orders', []).write();
    const ordersCol = router.db.get('orders');

    const id = Date.now();
    const madon = payload.madon || `DH${String(id).slice(-8)}`;
    const now = new Date().toISOString();

    const orderVN = {
      id,
      madon,
      user_id: uid ? String(uid) : null,
      thanhtien: amount,
      total: amount,
      trangthai: paymentMethod === 'cod' ? 'Đang chờ' : 'Đang chờ',
      trangthaithanhtoan: paymentMethod === 'online' ? 'Đã thanh toán' : 'Chưa thanh toán',
      created_at: now,
      updated_at: now,
      chitietdonhang: chitiet
    };

    ordersCol.push(orderVN).write();
    console.debug('[mock] order created (VN-shape) ->', orderVN);

    // respond in backward-compatible way
    return res.json({ status: true, data: { orderId: id, id, madon } });
  } catch (err) {
    console.error('[mock] create order error', err);
    return res.status(500).json({ status: false, message: 'mock create order error' });
  }
});

// List orders for current user (GET /api/tai-khoan/donhangs) — now reads "orders" collection
server.get('/api/tai-khoan/donhangs', (req, res) => {
  try {
    const uid = safeResolveUserId(req);
    if (!router.db.has('orders').value()) router.db.set('orders', []).write();
    let arr = router.db.get('orders').value() || [];
    if (uid) arr = arr.filter(o => String(o.user_id) === String(uid));
    return res.json({ status: true, data: arr });
  } catch (err) {
    console.error('[mock] list orders error', err);
    return res.status(500).json({ status: false });
  }
});

// Get single order by id (support several path variants) — now reads "orders"
server.get(['/api/tai-khoan/donhangs/:id', '/api/toi/donhang/:id', '/api/donhang/:id', '/api/orders/:id'], (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!router.db.has('orders').value()) router.db.set('orders', []).write();
    const found = router.db.get('orders').find({ id }).value();
    if (!found) return res.status(404).json({ status: false, message: 'Not found' });
    return res.json({ status: true, data: found });
  } catch (err) {
    console.error('[mock] get order error', err);
    return res.status(500).json({ status: false });
  }
});

// Cách A: Route tùy chỉnh trả về danh sách sản phẩm (payload rút gọn)
server.get('/api/sanphams', (req, res) => {
  const payload = {
    status: true,
    message: 'Danh sách sản phẩm',
    data: [
      {
        "status": true,
        "message": "Danh sách sản phẩm",
        "data": [
          {
            "id": 1,
            "ten": "Vitamin C 500mg",
            "mota": "Viên uống tăng sức đề kháng.",
            "xuatxu": "Mỹ",
            "sanxuat": "Nature Made",
            "mediaurl": "https://example.com/images/vitamin-c.jpg",
            "luotxem": 120,
            "ngaycapnhat": "27-09-2025 23:55:57",
            "danhgias": [
              {
                "id": 1,
                "diem": 4.5,
                "noidung": "Sản phẩm rất tốt, chất lượng đúng như mô tả. Giao hàng nhanh.",
                "media": "https://example.com/reviews/review1.jpg",
                "ngaydang": "04-01-2025 23:56:00",
                "trangthai": "hoat_dong"
              }
            ],
            "thuonghieu": {
              "id": 1,
              "ten": "Vinamilk",
              "mota": "Thương hiệu sữa và dinh dưỡng",
              "trangthai": "hoat_dong"
            },
            "danhmucs": [
              {
                "id": 2,
                "ten": "Chăm sóc cá nhân",
                "trangthai": "hoat_dong"
              }
            ],
            "bienthes": [
              {
                "id": 1,
                "gia": "34500.00",
                "giagiam": "0.00",
                "soluong": 20,
                "trangthai": "hoat_dong",
                "uutien": 1
              }
            ],
            "anhsanphams": [
              {
                "id": 1,
                "media": "yensaonest100_70ml_2.jpg",
                "trangthai": "hoat_dong"
              },
              {
                "id": 2,
                "media": "yensaonest100_70ml_3.jpg",
                "trangthai": "hoat_dong"
              }
            ],
            "loaibienthes": [
              {
                "ten": "lọ",
                "trangthai": "hoat_dong"
              }
            ]
          },
          {
            "id": 2,
            "ten": "Sữa rửa mặt dịu nhẹ",
            "mota": "Phù hợp cho da nhạy cảm.",
            "xuatxu": "Hàn Quốc",
            "sanxuat": "Innisfree",
            "mediaurl": "https://example.com/images/suaruamat.jpg",
            "luotxem": 90,
            "ngaycapnhat": "27-09-2025 23:55:57",
            "danhgias": [
              {
                "id": 2,
                "diem": 3.8,
                "noidung": "Hàng ổn, nhưng đóng gói chưa kỹ. Cần cải thiện thêm.",
                "media": "https://example.com/reviews/review2.jpg",
                "ngaydang": "04-01-2025 23:56:00",
                "trangthai": "hoat_dong"
              },
              {
                "id": 6,
                "diem": 3,
                "noidung": "Đánh giá thử số 6: chất lượng sản phẩm tốt, hài lòng.",
                "media": "https://example.com/reviews/review6.jpg",
                "ngaydang": "04-01-2025 23:56:00",
                "trangthai": "hoat_dong"
              },
              {
                "id": 15,
                "diem": 3,
                "noidung": "Đánh giá thử số 15: chất lượng sản phẩm tốt, hài lòng.",
                "media": "https://example.com/reviews/review15.jpg",
                "ngaydang": "04-01-2025 23:56:00",
                "trangthai": "hoat_dong"
              }
            ],
            "thuonghieu": {
              "id": 2,
              "ten": "Abbott",
              "mota": "Dinh dưỡng và thực phẩm chức năng",
              "trangthai": "hoat_dong"
            },
            "danhmucs": [],
            "bienthes": [],
            "anhsanphams": [],
            "loaibienthes": []
          },
          {
            "id": 3,
            "ten": "Máy đo huyết áp Omron",
            "mota": "Dụng cụ theo dõi sức khỏe tại nhà.",
            "xuatxu": "Nhật Bản",
            "sanxuat": "Omron",
            "mediaurl": "https://example.com/images/maydo-huyetap.jpg",
            "luotxem": 250,
            "ngaycapnhat": "27-09-2025 23:55:57",
            "danhgias": [],
            "thuonghieu": {
              "id": 3,
              "ten": "Nestle",
              "mota": "Sữa và sản phẩm dinh dưỡng",
              "trangthai": "hoat_dong"
            },
            "danhmucs": [
              {
                "id": 2,
                "ten": "Chăm sóc cá nhân",
                "trangthai": "hoat_dong"
              }
            ],
            "bienthes": [],
            "anhsanphams": [],
            "loaibienthes": []
          },
          {
            "id": 4,
            "ten": "Nồi chiên không dầu 5L",
            "mota": "Nấu ăn nhanh chóng, ít dầu mỡ.",
            "xuatxu": "Trung Quốc",
            "sanxuat": "Philips",
            "mediaurl": "https://example.com/images/noichien.jpg",
            "luotxem": 310,
            "ngaycapnhat": "27-09-2025 23:55:57",
            "danhgias": [],
            "thuonghieu": {
              "id": 4,
              "ten": "Mead Johnson",
              "mota": "Dinh dưỡng cho trẻ em",
              "trangthai": "hoat_dong"
            },
            "danhmucs": [
              {
                "id": 2,
                "ten": "Chăm sóc cá nhân",
                "trangthai": "hoat_dong"
              }
            ],
            "bienthes": [],
            "anhsanphams": [],
            "loaibienthes": []
          },
          {
            "id": 5,
            "ten": "Khẩu trang y tế 4 lớp",
            "mota": "Hộp 50 cái, chống bụi và vi khuẩn.",
            "xuatxu": "Việt Nam",
            "sanxuat": "VinMask",
            "mediaurl": "https://example.com/images/khau-trang.jpg",
            "luotxem": 400,
            "ngaycapnhat": "27-09-2025 23:55:57",
            "danhgias": [
              {
                "id": 12,
                "diem": 4.5,
                "noidung": "Đánh giá thử số 12: chất lượng sản phẩm tốt, hài lòng.",
                "media": "https://example.com/reviews/review12.jpg",
                "ngaydang": "04-01-2025 23:56:00",
                "trangthai": "hoat_dong"
              }
            ],
            "thuonghieu": {
              "id": 5,
              "ten": "Procare",
              "mota": "Thực phẩm chức năng",
              "trangthai": "hoat_dong"
            },
            "danhmucs": [
              {
                "id": 2,
                "ten": "Chăm sóc cá nhân",
                "trangthai": "hoat_dong"
              }
            ],
            "bienthes": [],
            "anhsanphams": [],
            "loaibienthes": []
          },
          {
            "id": 6,
            "ten": "Sữa tắm dưỡng ẩm Dove",
            "mota": "Dưỡng ẩm cho làn da mềm mịn.",
            "xuatxu": "Anh",
            "sanxuat": "Unilever",
            "mediaurl": "https://example.com/images/suatam-dove.jpg",
            "luotxem": 180,
            "ngaycapnhat": "27-09-2025 23:55:57",
            "danhgias": [
              {
                "id": 11,
                "diem": 3.9,
                "noidung": "Đánh giá thử số 11: chất lượng sản phẩm tốt, hài lòng.",
                "media": "https://example.com/reviews/review11.jpg",
                "ngaydang": "04-01-2025 23:56:00",
                "trangthai": "hoat_dong"
              }
            ],
            "thuonghieu": {
              "id": 6,
              "ten": "Ensure",
              "mota": "Dinh dưỡng người lớn",
              "trangthai": "hoat_dong"
            },
            "danhmucs": [],
            "bienthes": [
              {
                "id": 13,
                "gia": "109000.00",
                "giagiam": "0.00",
                "soluong": 3,
                "trangthai": "hoat_dong",
                "uutien": 0
              }
            ],
            "anhsanphams": [
              {
                "id": 3,
                "media": "sua-tam-nuoc-hoa-duong-da-parisian-chic-for-her-265ml-1.jpg",
                "trangthai": "ngung_hoat_dong"
              },
              {
                "id": 4,
                "media": "sua-tam-nuoc-hoa-duong-da-parisian-chic-for-her-265ml-2.jpg",
                "trangthai": "ngung_hoat_dong"
              },
              {
                "id": 5,
                "media": "sua-tam-nuoc-hoa-duong-da-parisian-chic-for-her-265ml-3.jpg",
                "trangthai": "ngung_hoat_dong"
              }
            ],
            "loaibienthes": [
              {
                "ten": "Lọ (265ml)",
                "trangthai": "hoat_dong"
              }
            ]
          },
          {
            "id": 7,
            "ten": "Sữa bột Abbott Grow",
            "mota": "Dành cho trẻ từ 2 tuổi trở lên.",
            "xuatxu": "Mỹ",
            "sanxuat": "Abbott",
            "mediaurl": "https://example.com/images/suabottre.jpg",
            "luotxem": 500,
            "ngaycapnhat": "27-09-2025 23:55:57",
            "danhgias": [
              {
                "id": 19,
                "diem": 4,
                "noidung": "Đánh giá thử số 19: chất lượng sản phẩm tốt, hài lòng.",
                "media": "https://example.com/reviews/review19.jpg",
                "ngaydang": "04-01-2025 23:56:00",
                "trangthai": "hoat_dong"
              }
            ],
            "thuonghieu": {
              "id": 7,
              "ten": "VitaDairy",
              "mota": "Sữa tươi và sản phẩm bổ sung",
              "trangthai": "hoat_dong"
            },
            "danhmucs": [
              {
                "id": 3,
                "ten": "Điện máy",
                "trangthai": "hoat_dong"
              }
            ],
            "bienthes": [
              {
                "id": 14,
                "gia": "395000.00",
                "giagiam": "0.00",
                "soluong": 291,
                "trangthai": "hoat_dong",
                "uutien": 0
              }
            ],
            "anhsanphams": [
              {
                "id": 6,
                "media": "ca-phe-dua-cappuccino-collagen-giup-tinh-tao-dep-da-20-goi-x-18g-1.jpg",
                "trangthai": "cho_duyet"
              },
              {
                "id": 7,
                "media": "ca-phe-dua-cappuccino-collagen-giup-tinh-tao-dep-da-20-goi-x-18g-2.jpg",
                "trangthai": "cho_duyet"
              },
              {
                "id": 8,
                "media": "ca-phe-dua-cappuccino-collagen-giup-tinh-tao-dep-da-20-goi-x-18g-3.jpg",
                "trangthai": "cho_duyet"
              },
              {
                "id": 9,
                "media": "ca-phe-dua-cappuccino-collagen-giup-tinh-tao-dep-da-20-goi-x-18g-4.jpg",
                "trangthai": "cho_duyet"
              },
              {
                "id": 10,
                "media": "ca-phe-dua-cappuccino-collagen-giup-tinh-tao-dep-da-20-goi-x-18g-5.jpg",
                "trangthai": "cho_duyet"
              }
            ],
            "loaibienthes": [
              {
                "ten": "hộp",
                "trangthai": "hoat_dong"
              }
            ]
          },
          {
            "id": 8,
            "ten": "Áo sơ mi nam trắng",
            "mota": "Chất liệu cotton thoáng mát.",
            "xuatxu": "Việt Nam",
            "sanxuat": "Canifa",
            "mediaurl": "https://example.com/images/ao-somi.jpg",
            "luotxem": 350,
            "ngaycapnhat": "27-09-2025 23:55:57",
            "danhgias": [],
            "thuonghieu": {
              "id": 8,
              "ten": "Dielac",
              "mota": "Sữa bột cho trẻ em",
              "trangthai": "hoat_dong"
            },
            "danhmucs": [],
            "bienthes": [
              {
                "id": 15,
                "gia": "360000.00",
                "giagiam": "0.00",
                "soluong": 1000,
                "trangthai": "hoat_dong",
                "uutien": 0
              }
            ],
            "anhsanphams": [
              {
                "id": 11,
                "media": "thuc-pham-bao-ve-suc-khoe-midu-menaq7-180mcg-1.jpg",
                "trangthai": "hoat_dong"
              },
              {
                "id": 12,
                "media": "thuc-pham-bao-ve-suc-khoe-midu-menaq7-180mcg-2.jpg",
                "trangthai": "hoat_dong"
              },
              {
                "id": 13,
                "media": "thuc-pham-bao-ve-suc-khoe-midu-menaq7-180mcg-3.jpg",
                "trangthai": "hoat_dong"
              },
              {
                "id": 14,
                "media": "thuc-pham-bao-ve-suc-khoe-midu-menaq7-180mcg-4.jpg",
                "trangthai": "hoat_dong"
              },
              {
                "id": 15,
                "media": "thuc-pham-bao-ve-suc-khoe-midu-menaq7-180mcg-5.jpg",
                "trangthai": "hoat_dong"
              }
            ],
            "loaibienthes": [
              {
                "ten": "Hộp (30 ống)",
                "trangthai": "hoat_dong"
              }
            ]
          },
          {
            "id": 9,
            "ten": "Giày sneaker Adidas",
            "mota": "Phong cách thể thao, năng động.",
            "xuatxu": "Đức",
            "sanxuat": "Adidas",
            "mediaurl": "https://example.com/images/giay-adidas.jpg",
            "luotxem": 600,
            "ngaycapnhat": "27-09-2025 23:55:57",
            "danhgias": [
              {
                "id": 8,
                "diem": 3.9,
                "noidung": "Đánh giá thử số 8: chất lượng sản phẩm tốt, hài lòng.",
                "media": "https://example.com/reviews/review8.jpg",
                "ngaydang": "04-01-2025 23:56:00",
                "trangthai": "hoat_dong"
              },
              {
                "id": 18,
                "diem": 4.7,
                "noidung": "Đánh giá thử số 18: chất lượng sản phẩm tốt, hài lòng.",
                "media": "https://example.com/reviews/review18.jpg",
                "ngaydang": "04-01-2025 23:56:00",
                "trangthai": "hoat_dong"
              },
              {
                "id": 20,
                "diem": 3.6,
                "noidung": "Đánh giá thử số 20: chất lượng sản phẩm tốt, hài lòng.",
                "media": "https://example.com/reviews/review20.jpg",
                "ngaydang": "04-01-2025 23:56:00",
                "trangthai": "hoat_dong"
              }
            ],
            "thuonghieu": {
              "id": 9,
              "ten": "FrieslandCampina",
              "mota": "Sữa và thực phẩm dinh dưỡng",
              "trangthai": "hoat_dong"
            },
            "danhmucs": [
              {
                "id": 7,
                "ten": "Mẹ và bé",
                "trangthai": "hoat_dong"
              }
            ],
            "bienthes": [],
            "anhsanphams": [],
            "loaibienthes": []
          },
          {
            "id": 10,
            "ten": "Bột giặt OMO Matic",
            "mota": "Giặt sạch vết bẩn, hương thơm lâu.",
            "xuatxu": "Việt Nam",
            "sanxuat": "Unilever",
            "mediaurl": "https://example.com/images/botgiat-omo.jpg",
            "luotxem": 270,
            "ngaycapnhat": "27-09-2025 23:55:57",
            "danhgias": [],
            "thuonghieu": {
              "id": 10,
              "ten": "Life Nutrition",
              "mota": "Thực phẩm bổ sung sức khỏe",
              "trangthai": "hoat_dong"
            },
            "danhmucs": [],
            "bienthes": [],
            "anhsanphams": [],
            "loaibienthes": []
          }
        ]
      }
    ]
  };
  const normalized = Array.isArray(payload.data) && payload.data.length === 1 && payload.data[0] && Array.isArray(payload.data[0].data)
    ? { status: payload.status, message: payload.message, data: payload.data[0].data }
    : payload;
  res.json(normalized);
});

// Route trả về danh sách sản phẩm theo selection=best_products (mock theo yêu cầu)
//http://localhost:4000/api/sanphams-selection?selection=best_products&per_page=8
server.get('/api/sanphams-selection', (req, res, next) => {
  const { selection, per_page } = req.query || {};
  if (selection !== 'best_products') return next();

  const payload = {
    status: true,
    message: 'Danh sách sản phẩm',
    data: [
      {
        id: 4,
        ten: 'Nồi chiên không dầu 5L',
        slug: 'noi-chien-khong-dau-5l',
        mediaurl: 'https://example.com/images/noichien.jpg',
        gia: { current: 0, before_discount: null, discount_percent: 0 },
        store: { name: 'Mead Johnson', icon_url: null },
        rating: { average: 5, count: 1 }
      },
      {
        id: 16,
        ten: 'Quạt điều hòa Sunhouse',
        slug: 'quat-dieu-hoa-sunhouse',
        mediaurl: 'https://example.com/images/quat-sunhouse.jpg',
        gia: { current: 0, before_discount: null, discount_percent: 0 },
        store: { name: 'Dove', icon_url: null },
        rating: { average: 4.8, count: 1 }
      },
      {
        id: 7,
        ten: 'Sữa bột Abbott Grow',
        slug: 'sua-bot-abbott-grow',
        mediaurl: 'https://example.com/images/suabottre.jpg',
        gia: { current: 395000, before_discount: '395000.00', discount_percent: 0 },
        store: { name: 'VitaDairy', icon_url: null },
        rating: { average: 4.7, count: 3 }
      },
      {
        id: 5,
        ten: 'Khẩu trang y tế 4 lớp',
        slug: 'khau-trang-y-te-4-lop',
        mediaurl: 'https://example.com/images/khau-trang.jpg',
        gia: { current: 0, before_discount: null, discount_percent: 0 },
        store: { name: 'Procare', icon_url: null },
        rating: { average: 4.7, count: 1 }
      },
      {
        id: 1,
        ten: 'Vitamin C 500mg',
        slug: 'vitamin-c-500mg',
        mediaurl: 'https://example.com/images/vitamin-c.jpg',
        gia: { current: 34500, before_discount: '34500.00', discount_percent: 0 },
        store: { name: 'Vinamilk', icon_url: null },
        rating: { average: 4.5, count: 1 }
      },
      {
        id: 13,
        ten: 'Tai nghe AirPods Pro',
        slug: 'tai-nghe-airpods-pro',
        mediaurl: 'https://example.com/images/airpods.jpg',
        gia: { current: 0, before_discount: null, discount_percent: 0 },
        store: { name: 'Unilever', icon_url: null },
        rating: { average: 4.4, count: 1 }
      },
      {
        id: 8,
        ten: 'Áo sơ mi nam trắng',
        slug: 'ao-so-mi-nam-trang',
        mediaurl: 'https://example.com/images/ao-somi.jpg',
        gia: { current: 360000, before_discount: '360000.00', discount_percent: 0 },
        store: { name: 'Dielac', icon_url: null },
        rating: { average: 4.3, count: 1 }
      },
      {
        id: 2,
        ten: 'Sữa rửa mặt dịu nhẹ',
        slug: 'sua-rua-mat-diu-nhe',
        mediaurl: 'https://example.com/images/suaruamat.jpg',
        gia: { current: 0, before_discount: null, discount_percent: 0 },
        store: { name: 'Abbott', icon_url: null },
        rating: { average: 4.3, count: 2 }
      }
    ]
  };

  let data = payload.data;
  const n = per_page ? parseInt(String(per_page), 10) : NaN;
  if (!Number.isNaN(n) && n > 0) {
    data = data.slice(0, n);
  }
  return res.json({ status: payload.status, message: payload.message, data });
});

// Route trả về danh sách thương hiệu theo selection=top_brands (mock)
// Ví dụ: http://localhost:4000/api/sanphams-selection?selection=top_brands&qer_page=10
server.get('/api/sanphams-selection', (req, res, next) => {
  const { selection } = req.query || {};
  const perPageRaw = (req.query?.per_page ?? req.query?.qer_page);
  if (selection !== 'top_brands') return next();

  const payload = {
    status: true,
    message: 'Danh sách thuong hieu',
    data: [
      { id: 37, ten: '3M', slug: '3m', media: '3m.png', namthanhlap: 1902, mota: 'Thiết bị y tế và bảo hộ', total_sold: 0 },
      { id: 48, ten: '7-Eleven', slug: '7-eleven', media: '7eleven.png', namthanhlap: 1927, mota: 'Chuỗi cửa hàng tiện lợi', total_sold: 0 },
      { id: 2, ten: 'Abbott', slug: 'abbott', media: 'abbott.png', namthanhlap: 1888, mota: 'Dinh dưỡng và thực phẩm chức năng', total_sold: 0 },
      { id: 71, ten: 'Adidas', slug: 'adidas', media: 'adidas.png', namthanhlap: 1949, mota: 'Thời trang thể thao', total_sold: 0 },
      { id: 44, ten: 'Aeon', slug: 'aeon', media: 'aeon.png', namthanhlap: 1758, mota: 'Trung tâm bách hóa tổng hợp', total_sold: 0 },
      { id: 54, ten: 'Aeon Home', slug: 'aeon-home', media: 'aeon_home.png', namthanhlap: 2010, mota: 'Gia dụng và trang trí nhà', total_sold: 0 },
      { id: 80, ten: 'Apple', slug: 'apple', media: 'apple.png', namthanhlap: 1976, mota: 'Điện thoại, máy tính và phụ kiện', total_sold: 0 },
      { id: 68, ten: 'Aprica', slug: 'aprica', media: 'aprica.png', namthanhlap: 1947, mota: 'Xe đẩy và sản phẩm mẹ bé', total_sold: 0 },
      { id: 29, ten: 'Asanzo', slug: 'asanzo', media: 'asanzo.png', namthanhlap: 2013, mota: 'Điện tử Việt Nam', total_sold: 0 },
      { id: 84, ten: 'Asus', slug: 'asus', media: 'asus.png', namthanhlap: 1989, mota: 'Laptop, máy tính và linh kiện', total_sold: 0 }
    ]
  };

  let data = payload.data;
  const n = perPageRaw ? parseInt(String(perPageRaw), 10) : NaN;
  if (!Number.isNaN(n) && n > 0) data = data.slice(0, n);
  return res.json({ status: payload.status, message: payload.message, data });
});

// Route trả về danh mục theo selection=top_categories (mock)
// Ví dụ: http://localhost:4000/api/sanphams-selection?selection=top_categories&per_page=6
server.get('/api/sanphams-selection', (req, res, next) => {
  const { selection } = req.query || {};
  const perPageRaw = req.query?.per_page;
  if (selection !== 'top_categories') return next();

  const payload = {
    status: true,
    message: 'Danh sách sản phẩm',
    data: {
      headers: {},
      original: [
        {
          id: 1,
          ten: 'Sức khỏe',
          slug: 'suc-khoe',
          total_sold: 0,
          sanphams: []
        },
        {
          id: 2,
          ten: 'Chăm sóc cá nhân',
          slug: 'cham-soc-ca-nhan',
          total_sold: 0,
          sanphams: [
            {
              id: 1,
              ten: 'Vitamin C 500mg',
              slug: 'vitamin-c-500mg',
              mota: 'Viên uống tăng sức đề kháng.',
              xuatxu: 'Mỹ',
              sanxuat: 'Nature Made',
              mediaurl: 'https://example.com/images/vitamin-c.jpg',
              image_url: 'yensaonest100_70ml_2.jpg',
              luotxem: 120,
              ngaycapnhat: '27-09-2025 23:55:57',
              thuonghieu: { id: 1, ten: 'Vinamilk', mota: 'Thương hiệu sữa và dinh dưỡng', trangthai: 'hoat_dong' },
              bienthes: [{ id: 1, gia: '34500.00', giagiam: '0.00', soluong: 20, trangthai: 'hoat_dong', uutien: 1 }],
              anhsanphams: [
                { id: 1, media: 'yensaonest100_70ml_2.jpg', trangthai: 'hoat_dong' },
                { id: 2, media: 'yensaonest100_70ml_3.jpg', trangthai: 'hoat_dong' }
              ],
              danhgias: [
                { id: 1, diem: 4.5, noidung: 'Sản phẩm rất tốt, chất lượng đúng như mô tả. Giao hàng nhanh.', media: 'https://example.com/reviews/review1.jpg', ngaydang: '04-01-2025 23:56:00', trangthai: 'hoat_dong' }
              ],
              original_price: '34500.00',
              discount_amount: '0.00',
              selling_price: 34500,
              discount_type: null,
              is_free: false,
              is_sold: false,
              rating_average: 4.5,
              rating_count: 1,
              seller_name: 'Vinamilk',
              product_meta: { soluong_ton: 20, mota_ngan: 'Viên uống tăng sức đề kháng.' }
            },
            {
              id: 3,
              ten: 'Máy đo huyết áp Omron',
              slug: 'may-do-huyet-ap-omron',
              mota: 'Dụng cụ theo dõi sức khỏe tại nhà.',
              xuatxu: 'Nhật Bản',
              sanxuat: 'Omron',
              mediaurl: 'https://example.com/images/maydo-huyetap.jpg',
              image_url: null,
              luotxem: 250,
              ngaycapnhat: '27-09-2025 23:55:57',
              thuonghieu: { id: 3, ten: 'Nestle', mota: 'Sữa và sản phẩm dinh dưỡng', trangthai: 'hoat_dong' },
              bienthes: [],
              anhsanphams: [],
              danhgias: [],
              original_price: null,
              discount_amount: null,
              selling_price: 0,
              discount_type: 'Miễn phí',
              is_free: true,
              is_sold: false,
              rating_average: 0,
              rating_count: 0,
              seller_name: 'Nestle',
              product_meta: { soluong_ton: 0, mota_ngan: 'Dụng cụ theo dõi sức khỏe tại nhà.' }
            },
            {
              id: 4,
              ten: 'Nồi chiên không dầu 5L',
              slug: 'noi-chien-khong-dau-5l',
              mota: 'Nấu ăn nhanh chóng, ít dầu mỡ.',
              xuatxu: 'Trung Quốc',
              sanxuat: 'Philips',
              mediaurl: 'https://example.com/images/noichien.jpg',
              image_url: null,
              luotxem: 310,
              ngaycapnhat: '27-09-2025 23:55:57',
              thuonghieu: { id: 4, ten: 'Mead Johnson', mota: 'Dinh dưỡng cho trẻ em', trangthai: 'hoat_dong' },
              bienthes: [],
              anhsanphams: [],
              danhgias: [],
              original_price: null,
              discount_amount: null,
              selling_price: 0,
              discount_type: 'Miễn phí',
              is_free: true,
              is_sold: false,
              rating_average: 0,
              rating_count: 0,
              seller_name: 'Mead Johnson',
              product_meta: { soluong_ton: 0, mota_ngan: 'Nấu ăn nhanh chóng, ít dầu mỡ.' }
            },
            {
              id: 5,
              ten: 'Khẩu trang y tế 4 lớp',
              slug: 'khau-trang-y-te-4-lop',
              mota: 'Hộp 50 cái, chống bụi và vi khuẩn.',
              xuatxu: 'Việt Nam',
              sanxuat: 'VinMask',
              mediaurl: 'https://example.com/images/khau-trang.jpg',
              image_url: null,
              luotxem: 400,
              ngaycapnhat: '27-09-2025 23:55:57',
              thuonghieu: { id: 5, ten: 'Procare', mota: 'Thực phẩm chức năng', trangthai: 'hoat_dong' },
              bienthes: [],
              anhsanphams: [],
              danhgias: [{ id: 12, diem: 4.5, noidung: 'Đánh giá thử số 12: chất lượng sản phẩm tốt, hài lòng.', media: 'https://example.com/reviews/review12.jpg', ngaydang: '04-01-2025 23:56:00', trangthai: 'hoat_dong' }],
              original_price: null,
              discount_amount: null,
              selling_price: 0,
              discount_type: 'Miễn phí',
              is_free: true,
              is_sold: false,
              rating_average: 4.5,
              rating_count: 1,
              seller_name: 'Procare',
              product_meta: { soluong_ton: 0, mota_ngan: 'Hộp 50 cái, chống bụi và vi khuẩn.' }
            }
          ]
        },
        {
          id: 3, ten: 'Điện máy', slug: 'dien-may', total_sold: 0, sanphams: [
            {
              id: 7,
              ten: 'Sữa bột Abbott Grow',
              slug: 'sua-bot-abbott-grow',
              mota: 'Dành cho trẻ từ 2 tuổi trở lên.',
              xuatxu: 'Mỹ',
              sanxuat: 'Abbott',
              mediaurl: 'https://example.com/images/suabottre.jpg',
              image_url: 'ca-phe-dua-cappuccino-collagen-giup-tinh-tao-dep-da-20-goi-x-18g-1.jpg',
              luotxem: 500,
              ngaycapnhat: '27-09-2025 23:55:57',
              thuonghieu: { id: 7, ten: 'VitaDairy', mota: 'Sữa tươi và sản phẩm bổ sung', trangthai: 'hoat_dong' },
              bienthes: [{ id: 14, gia: '395000.00', giagiam: '0.00', soluong: 291, trangthai: 'hoat_dong', uutien: 0 }],
              anhsanphams: [
                { id: 6, media: 'ca-phe-dua-cappuccino-collagen-giup-tinh-tao-dep-da-20-goi-x-18g-1.jpg', trangthai: 'cho_duyet' },
                { id: 7, media: 'ca-phe-dua-cappuccino-collagen-giup-tinh-tao-dep-da-20-goi-x-18g-2.jpg', trangthai: 'cho_duyet' },
                { id: 8, media: 'ca-phe-dua-cappuccino-collagen-giup-tinh-tao-dep-da-20-goi-x-18g-3.jpg', trangthai: 'cho_duyet' },
                { id: 9, media: 'ca-phe-dua-cappuccino-collagen-giup-tinh-tao-dep-da-20-goi-x-18g-4.jpg', trangthai: 'cho_duyet' },
                { id: 10, media: 'ca-phe-dua-cappuccino-collagen-giup-tinh-tao-dep-da-20-goi-x-18g-5.jpg', trangthai: 'cho_duyet' }
              ],
              danhgias: [{ id: 19, diem: 4, noidung: 'Đánh giá thử số 19: chất lượng sản phẩm tốt, hài lòng.', media: 'https://example.com/reviews/review19.jpg', ngaydang: '04-01-2025 23:56:00', trangthai: 'hoat_dong' }],
              original_price: '395000.00',
              discount_amount: '0.00',
              selling_price: 395000,
              discount_type: null,
              is_free: false,
              is_sold: false,
              rating_average: 4,
              rating_count: 1,
              seller_name: 'VitaDairy',
              product_meta: { soluong_ton: 291, mota_ngan: 'Dành cho trẻ từ 2 tuổi trở lên.' }
            }
          ]
        },
        { id: 4, ten: 'Thiết bị y tế', slug: 'thiet-bi-y-te', total_sold: 0, sanphams: [] },
        { id: 5, ten: 'Bách hóa', slug: 'bach-hoa', total_sold: 0, sanphams: [] },
        { id: 6, ten: 'Nhà cửa - Đời sống', slug: 'nha-cua-doi-song', total_sold: 0, sanphams: [] }
      ],
      exception: null
    }
  };

  const n = perPageRaw ? parseInt(String(perPageRaw), 10) : NaN;
  if (!Number.isNaN(n) && n > 0) {
    payload.data.original = payload.data.original.slice(0, n);
  }
  return res.json(payload);
});

// Route trả về danh sách hot_sales (mock)
// Ví dụ hợp lệ: /api/sanphams-selection?selection=hot_sales&per_page=10
// Một số FE có thể gọi sai: /api/sanphams-selection?selection=hot_sales?per_page=10
// -> Ta sẽ tự tách để lấy đúng selection và per_page
// http://localhost:4000/api/sanphams-selection?selection=hot_sales&per_page=10
server.get('/api/sanphams-selection', (req, res, next) => {
  const selectionRaw = String(req.query?.selection ?? '');
  const [selectionParsed, tail] = selectionRaw.split('?');
  if (selectionParsed !== 'hot_sales') return next();

  // Lấy per_page từ query chuẩn hoặc từ tail phần sai
  let perPage = req.query?.per_page ? parseInt(String(req.query.per_page), 10) : NaN;
  if (Number.isNaN(perPage) && tail) {
    const m = tail.match(/per_page=(\d+)/);
    if (m) perPage = parseInt(m[1], 10);
  }
  if (!Number.isFinite(perPage) || perPage <= 0) perPage = 10;

  // LẤY DỮ LIỆU TỪ db.json (key: api_sanphams_selection_hot_sales)
  const all = router.db.get('api_sanphams_selection_hot_sales').value() || [];
  let data = Array.isArray(all) ? all : (Array.isArray(all?.data) ? all.data : []);
  data = data.slice(0, perPage);

  return res.json({ status: true, message: 'Danh sách sản phẩm (hot_sales)', data });
});


// Route trả về danh sách recommend (mock)
// Ví dụ hợp lệ: /api/sanphams-selection?selection=recommend&per_page=8
// Một số FE có thể gọi sai: /api/sanphams-selection?selection=recommend?per_page=8
server.get('/api/sanphams-selection', (req, res, next) => {
  const selectionRaw = String(req.query?.selection ?? '');
  const [selectionParsedRaw, tail] = selectionRaw.split('?');
  const selectionParsed = selectionParsedRaw.trim();
  if (selectionParsed !== 'recommend') return next();

  // Lấy per_page (mặc định 8)
  let perPage = req.query?.per_page ? parseInt(String(req.query.per_page), 10) : NaN;
  if (Number.isNaN(perPage) && tail) {
    const m = tail.match(/per_page=(\d+)/);
    if (m) perPage = parseInt(m[1], 10);
  }
  if (!Number.isFinite(perPage) || perPage <= 0) perPage = 8;

  const payload = {
    status: true,
    message: 'Danh sách sản phẩm',
    data: [
      { id: 1, ten: 'Vitamin C 500mg', slug: 'vitamin-c-500mg', mediaurl: 'https://example.com/images/vitamin-c.jpg', gia: { current: 34500, before_discount: '34500.00', discount_percent: 0 }, store: { name: 'Vinamilk', icon_url: null }, rating: { average: 4.5, count: 1 } },
      { id: 7, ten: 'Sữa bột Abbott Grow', slug: 'sua-bot-abbott-grow', mediaurl: 'https://example.com/images/suabottre.jpg', gia: { current: 395000, before_discount: '395000.00', discount_percent: 0 }, store: { name: 'VitaDairy', icon_url: null }, rating: { average: 4.3, count: 2 } },
      { id: 6, ten: 'Sữa tắm dưỡng ẩm Dove', slug: 'sua-tam-duong-am-dove', mediaurl: 'https://example.com/images/suatam-dove.jpg', gia: { current: 109000, before_discount: '109000.00', discount_percent: 0 }, store: { name: 'Ensure', icon_url: null }, rating: { average: 0, count: 0 } },
      { id: 8, ten: 'Áo sơ mi nam trắng', slug: 'ao-so-mi-nam-trang', mediaurl: 'https://example.com/images/ao-somi.jpg', gia: { current: 360000, before_discount: '360000.00', discount_percent: 0 }, store: { name: 'Dielac', icon_url: null }, rating: { average: 0, count: 0 } },
      { id: 15, ten: 'Máy giặt LG Inverter', slug: 'may-giat-lg-inverter', mediaurl: 'https://example.com/images/maygiat-lg.jpg', gia: { current: 0, before_discount: null, discount_percent: 0 }, store: { name: 'Colgate', icon_url: null }, rating: { average: 5, count: 1 } },
      { id: 14, ten: 'Tivi Samsung 55 inch 4K', slug: 'tivi-samsung-55-inch-4k', mediaurl: 'https://example.com/images/tivi-samsung.jpg', gia: { current: 0, before_discount: null, discount_percent: 0 }, store: { name: 'L’Oreal', icon_url: null }, rating: { average: 4.8, count: 1 } },
      { id: 10, ten: 'Bột giặt OMO Matic', slug: 'bot-giat-omo-matic', mediaurl: 'https://example.com/images/botgiat-omo.jpg', gia: { current: 0, before_discount: null, discount_percent: 0 }, store: { name: 'Life Nutrition', icon_url: null }, rating: { average: 4.7, count: 1 } },
      { id: 18, ten: 'Bánh quy Oreo', slug: 'banh-quy-oreo', mediaurl: 'https://example.com/images/oreo.jpg', gia: { current: 0, before_discount: null, discount_percent: 0 }, store: { name: 'Garnier', icon_url: null }, rating: { average: 4.6, count: 1 } }
    ]
  };

  const data = payload.data.slice(0, perPage);
  return res.json({ status: payload.status, message: payload.message, data });
});

// ------- TỪ KHÓA: GET/PUT/POST -------
// Seed dữ liệu nếu chưa có
function ensureTukhoasSeed() {
  const has = router.db.has('tukhoas').value();
  if (!has) {
    router.db.set('tukhoas', [
      { id: 1, dulieu: 'Chăm sóc cá nhân', soluot: 150, dayTao: '2025-10-02 11:23:58', dayCapNhat: '2025-10-02 11:23:58' },
      { id: 2, dulieu: 'Làm đẹp', soluot: 201, dayTao: '2025-10-02 11:23:58', dayCapNhat: '2025-10-02 05:30:14' },
      { id: 3, dulieu: 'Tìm kiếm sản phẩm', soluot: 80, dayTao: '2025-10-02 11:23:58', dayCapNhat: '2025-10-02 11:23:58' },
      { id: 4, dulieu: 'Thực phâm thức năng', soluot: 120, dayTao: '2025-10-02 11:23:58', dayCapNhat: '2025-10-02 11:23:58' },
      { id: 5, dulieu: 'Điện máy', soluot: 90, dayTao: '2025-10-02 11:23:58', dayCapNhat: '2025-10-02 11:23:58' },
      { id: 6, dulieu: 'Mẹ và bé', soluot: 60, dayTao: '2025-10-02 11:23:58', dayCapNhat: '2025-10-02 11:23:58' },
      { id: 7, dulieu: 'Gia dụng nhà bếp', soluot: 40, dayTao: '2025-10-02 11:23:58', dayCapNhat: '2025-10-02 11:23:58' }
    ]).write();
  }
}

function nowStr() {
  const pad = (n) => String(n).padStart(2, '0');
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

// GET /api/tukhoas?per_page=5&page=1&q=...
server.get('/api/tukhoas', (req, res) => {
  ensureTukhoasSeed();
  const perPage = parseInt(String(req.query?.per_page ?? '5'), 10) || 5;
  const page = parseInt(String(req.query?.page ?? '1'), 10) || 1;
  const q = String(req.query?.q ?? '').trim().toLowerCase();

  let list = router.db.get('tukhoas').value();
  if (q) list = list.filter(x => String(x.dulieu || '').toLowerCase().includes(q));
  // Sắp xếp theo soluot giảm dần như ví dụ hay dùng
  list = list.sort((a, b) => (b.soluot || 0) - (a.soluot || 0));

  const total = list.length;
  const lastPage = Math.max(1, Math.ceil(total / perPage));
  const currentPage = Math.min(Math.max(1, page), lastPage);
  const start = (currentPage - 1) * perPage;
  const data = list.slice(start, start + perPage);

  const base = 'http://localhost:4000/api/tukhoas';
  const mkUrl = (p) => `${base}?page=${p}` + `&per_page=${perPage}` + (q ? `&q=${encodeURIComponent(q)}` : '');

  const linksArr = [
    { url: null, label: '&laquo; Previous', active: false },
    { url: mkUrl(1), label: '1', active: currentPage === 1 },
    ...(lastPage >= 2 ? [{ url: mkUrl(2), label: '2', active: currentPage === 2 }] : []),
    { url: currentPage < lastPage ? mkUrl(currentPage + 1) : mkUrl(lastPage), label: 'Next &raquo;', active: false }
  ];

  return res.json({
    data,
    links: {
      first: mkUrl(1),
      last: mkUrl(lastPage),
      prev: currentPage > 1 ? mkUrl(currentPage - 1) : null,
      next: currentPage < lastPage ? mkUrl(currentPage + 1) : null
    },
    meta: {
      current_page: currentPage,
      from: total === 0 ? null : start + 1,
      last_page: lastPage,
      links: linksArr,
      path: base,
      per_page: perPage,
      to: total === 0 ? null : Math.min(start + perPage, total),
      total
    }
  });
});

// PUT /api/tukhoas/:id - tăng soluot (mặc định +1, nếu body.soluot thì +body.soluot)
server.put('/api/tukhoas/:id', (req, res) => {
  ensureTukhoasSeed();
  const id = parseInt(req.params.id, 10);
  const inc = req.body && typeof req.body.soluot === 'number' ? req.body.soluot : 1;
  const col = router.db.get('tukhoas');
  const item = col.find({ id }).value();
  if (!item) return res.status(404).json({ message: 'Không tìm thấy từ khóa' });

  const updated = { ...item, soluot: (item.soluot || 0) + inc, dayCapNhat: nowStr() };
  col.find({ id }).assign(updated).write();
  return res.json({ data: updated, message: 'Cập nhật số lượt thành công' });
});

// POST /api/tukhoas - tạo mới từ khóa
// body: { dulieu: string, soluot?: number }
server.post('/api/tukhoas', (req, res) => {
  ensureTukhoasSeed();
  const { dulieu, soluot } = req.body || {};
  if (!dulieu) return res.status(400).json({ message: 'Thiếu dulieu' });
  const col = router.db.get('tukhoas');
  const now = nowStr();
  const nextId = (col.value().reduce((m, x) => Math.max(m, x.id), 0) || 0) + 1;
  const newItem = { id: nextId, dulieu, soluot: typeof soluot === 'number' ? soluot : 1, dayTao: now, dayCapNhat: now };
  col.push(newItem).write();
  return res.status(201).json({ data: newItem, message: 'Tạo từ khóa thành công' });
});

// ------- SẢN PHẨM CHI TIẾT: GET /api/sanphams-all/:id -------
server.get('/api/sanphams-all/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  // Hiện mock dữ liệu chi tiết cho id=6 theo schema yêu cầu
  //http://localhost:4000/api/sanphams-all/6
  if (id === 6) {
    const data = {
      id: 6,
      ten: 'Sữa tắm dưỡng ẩm Dove',
      slug: 'sua-tam-duong-am-dove',
      rating: {
        average: 3,
        count: 2,
        sao_5: 0,
        sao_4: 0,
        sao_3: 2,
        sao_2: 0,
        sao_1: 0
      },
      sold: {
        total_sold: 0,
        total_quantity: '3'
      },
      gia: {
        current: 109000,
        before_discount: '109000.00',
        discount_percent: 0
      },
      trangthai: {
        active: 'hoat_dong',
        in_stock: true
      },
      loai_bien_the: [
        { ten: 'Lọ (265ml)', trangthai: 'hoat_dong' }
      ],
      anh_san_pham: [
        { id: 3, media: 'sua-tam-nuoc-hoa-duong-da-parisian-chic-for-her-265ml-1.jpg', trangthai: 'ngung_hoat_dong' },
        { id: 4, media: 'sua-tam-nuoc-hoa-duong-da-parisian-chic-for-her-265ml-2.jpg', trangthai: 'ngung_hoat_dong' },
        { id: 5, media: 'sua-tam-nuoc-hoa-duong-da-parisian-chic-for-her-265ml-3.jpg', trangthai: 'ngung_hoat_dong' }
      ],
      danh_gia: [
        {
          id: 17,
          diem: 3,
          noidung: 'Đánh giá thử số 17: chất lượng sản phẩm tốt, hài lòng.',
          media: 'https://example.com/reviews/review17.jpg',
          ngaydang: '11-02-2025 20:26:15',
          trangthai: 'hoat_dong',
          nguoidung: {
            id: 25,
            email: 'user25@example.com',
            avatar: 'https://i.pravatar.cc/150?img=25',
            hoten: 'User 25',
            gioitinh: 'nữ',
            ngaysinh: null,
            sodienthoai: '09876543225',
            trangthai: 'hoat_dong'
          }
        },
        {
          id: 20,
          diem: 3,
          noidung: 'Đánh giá thử số 20: chất lượng sản phẩm tốt, hài lòng.',
          media: 'https://example.com/reviews/review20.jpg',
          ngaydang: '11-02-2025 20:26:15',
          trangthai: 'hoat_dong',
          nguoidung: {
            id: 33,
            email: 'user33@example.com',
            avatar: 'https://i.pravatar.cc/150?img=33',
            hoten: 'User 33',
            gioitinh: 'nữ',
            ngaysinh: null,
            sodienthoai: '09876543233',
            trangthai: 'hoat_dong'
          }
        }
      ],
      mota: 'Dưỡng ẩm cho làn da mềm mịn.'
    };
    return res.json({ data });
  }

  return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
});

// ------- SẢN PHẨM LIST: GET /api/sanphams-all -------
// Hỗ trợ: filter=popular|latest|trending|matches, per_page, page|pape, q
// Mặc định: trả 20 sản phẩm (per_page=20) sắp xếp theo "update mới nhất" (giả lập bằng thứ tự danh sách)
//http://localhost:4000/api/sanphams-all mặc định 20 mục
// có filter
//http://localhost:4000/api/sanphams-all?filter=popular
//http://localhost:4000/api/sanphams-all?filter=latest
//http://localhost:4000/api/sanphams-all?filter=trending
//http://localhost:4000/api/sanphams-all?filter=matches&user_id=123
// có tìm kiếm http://localhost:4000/api/sanphams-all?q=vitamin
server.get('/api/sanphams-all', (req, res) => {
  // Base 20 sản phẩm (mock theo schema giản lược)
  const base = [
    { id: 1, ten: 'Vitamin C 500mg', slug: 'vitamin-c-500mg', mediaurl: 'https://example.com/images/vitamin-c.jpg', rating: { average: 4.5, count: 1 }, sold: { total_sold: 0, total_quantity: '20' }, gia: { current: 34500, before_discount: '34500.00', discount_percent: 0 }, trangthai: { active: 'hoat_dong', in_stock: true } },
    { id: 2, ten: 'Sữa rửa mặt dịu nhẹ', slug: 'sua-rua-mat-diu-nhe', mediaurl: 'https://example.com/images/suaruamat.jpg', rating: { average: 3.6, count: 2 }, sold: { total_sold: 0, total_quantity: 0 }, gia: { current: 0, before_discount: null, discount_percent: 0 }, trangthai: { active: 'hoat_dong', in_stock: false } },
    { id: 3, ten: 'Máy đo huyết áp Omron', slug: 'may-do-huyet-ap-omron', mediaurl: 'https://example.com/images/maydo-huyetap.jpg', rating: { average: 4.4, count: 1 }, sold: { total_sold: 0, total_quantity: 0 }, gia: { current: 0, before_discount: null, discount_percent: 0 }, trangthai: { active: 'hoat_dong', in_stock: false } },
    { id: 4, ten: 'Nồi chiên không dầu 5L', slug: 'noi-chien-khong-dau-5l', mediaurl: 'https://example.com/images/noichien.jpg', rating: { average: 3.8, count: 2 }, sold: { total_sold: 0, total_quantity: 0 }, gia: { current: 0, before_discount: null, discount_percent: 0 }, trangthai: { active: 'hoat_dong', in_stock: false } },
    { id: 5, ten: 'Khẩu trang y tế 4 lớp', slug: 'khau-trang-y-te-4-lop', mediaurl: 'https://example.com/images/khau-trang.jpg', rating: { average: 0, count: 0 }, sold: { total_sold: 0, total_quantity: 0 }, gia: { current: 0, before_discount: null, discount_percent: 0 }, trangthai: { active: 'hoat_dong', in_stock: false } },
    { id: 6, ten: 'Sữa tắm dưỡng ẩm Dove', slug: 'sua-tam-duong-am-dove', mediaurl: 'https://example.com/images/suatam-dove.jpg', rating: { average: 0, count: 0 }, sold: { total_sold: 0, total_quantity: '3' }, gia: { current: 109000, before_discount: '109000.00', discount_percent: 0 }, trangthai: { active: 'hoat_dong', in_stock: true } },
    { id: 7, ten: 'Sữa bột Abbott Grow', slug: 'sua-bot-abbott-grow', mediaurl: 'https://example.com/images/suabottre.jpg', rating: { average: 4.1, count: 2 }, sold: { total_sold: 0, total_quantity: '291' }, gia: { current: 395000, before_discount: '395000.00', discount_percent: 0 }, trangthai: { active: 'hoat_dong', in_stock: true } },
    { id: 8, ten: 'Áo sơ mi nam trắng', slug: 'ao-so-mi-nam-trang', mediaurl: 'https://example.com/images/ao-somi.jpg', rating: { average: 0, count: 0 }, sold: { total_sold: 0, total_quantity: '1000' }, gia: { current: 360000, before_discount: '360000.00', discount_percent: 0 }, trangthai: { active: 'hoat_dong', in_stock: true } },
    { id: 9, ten: 'Giày sneaker Adidas', slug: 'giay-sneaker-adidas', mediaurl: 'https://example.com/images/giay-adidas.jpg', rating: { average: 3.7, count: 4 }, sold: { total_sold: 0, total_quantity: 0 }, gia: { current: 0, before_discount: null, discount_percent: 0 }, trangthai: { active: 'hoat_dong', in_stock: false } },
    { id: 10, ten: 'Bột giặt OMO Matic', slug: 'bot-giat-omo-matic', mediaurl: 'https://example.com/images/botgiat-omo.jpg', rating: { average: 3.8, count: 1 }, sold: { total_sold: 0, total_quantity: 0 }, gia: { current: 0, before_discount: null, discount_percent: 0 }, trangthai: { active: 'hoat_dong', in_stock: false } },
    { id: 11, ten: 'Laptop Dell Inspiron 15', slug: 'laptop-dell-inspiron-15', mediaurl: 'https://example.com/images/dell-inspiron.jpg', rating: { average: 4.3, count: 2 }, sold: { total_sold: 0, total_quantity: 0 }, gia: { current: 0, before_discount: null, discount_percent: 0 }, trangthai: { active: 'hoat_dong', in_stock: false } },
    { id: 12, ten: 'Điện thoại iPhone 15 Pro', slug: 'dien-thoai-iphone-15-pro', mediaurl: 'https://example.com/images/iphone-15.jpg', rating: { average: 4.9, count: 1 }, sold: { total_sold: 0, total_quantity: 0 }, gia: { current: 0, before_discount: null, discount_percent: 0 }, trangthai: { active: 'hoat_dong', in_stock: false } },
    { id: 13, ten: 'Tai nghe AirPods Pro', slug: 'tai-nghe-airpods-pro', mediaurl: 'https://example.com/images/airpods.jpg', rating: { average: 0, count: 0 }, sold: { total_sold: 0, total_quantity: 0 }, gia: { current: 0, before_discount: null, discount_percent: 0 }, trangthai: { active: 'hoat_dong', in_stock: false } },
    { id: 14, ten: 'Tivi Samsung 55 inch 4K', slug: 'tivi-samsung-55-inch-4k', mediaurl: 'https://example.com/images/tivi-samsung.jpg', rating: { average: 0, count: 0 }, sold: { total_sold: 0, total_quantity: 0 }, gia: { current: 0, before_discount: null, discount_percent: 0 }, trangthai: { active: 'hoat_dong', in_stock: false } },
    { id: 15, ten: 'Máy giặt LG Inverter', slug: 'may-giat-lg-inverter', mediaurl: 'https://example.com/images/maygiat-lg.jpg', rating: { average: 0, count: 0 }, sold: { total_sold: 0, total_quantity: 0 }, gia: { current: 0, before_discount: null, discount_percent: 0 }, trangthai: { active: 'hoat_dong', in_stock: false } },
    { id: 16, ten: 'Quạt điều hòa Sunhouse', slug: 'quat-dieu-hoa-sunhouse', mediaurl: 'https://example.com/images/quat-sunhouse.jpg', rating: { average: 4.4, count: 1 }, sold: { total_sold: 0, total_quantity: 0 }, gia: { current: 0, before_discount: null, discount_percent: 0 }, trangthai: { active: 'hoat_dong', in_stock: false } },
    { id: 17, ten: 'Bàn chải điện Oral-B', slug: 'ban-chai-dien-oral-b', mediaurl: 'https://example.com/images/ban-chai.jpg', rating: { average: 0, count: 0 }, sold: { total_sold: 0, total_quantity: 0 }, gia: { current: 0, before_discount: null, discount_percent: 0 }, trangthai: { active: 'hoat_dong', in_stock: false } },
    { id: 18, ten: 'Bánh quy Oreo', slug: 'banh-quy-oreo', mediaurl: 'https://example.com/images/oreo.jpg', rating: { average: 3.9, count: 1 }, sold: { total_sold: 0, total_quantity: 0 }, gia: { current: 0, before_discount: null, discount_percent: 0 }, trangthai: { active: 'hoat_dong', in_stock: false } },
    { id: 19, ten: 'Nước ngọt Coca-Cola', slug: 'nuoc-ngot-coca-cola', mediaurl: 'https://example.com/images/coca.jpg', rating: { average: 4.2, count: 1 }, sold: { total_sold: 0, total_quantity: 0 }, gia: { current: 0, before_discount: null, discount_percent: 0 }, trangthai: { active: 'hoat_dong', in_stock: false } },
    { id: 20, ten: 'Trà xanh Lipton', slug: 'tra-xanh-lipton', mediaurl: 'https://example.com/images/lipton.jpg', rating: { average: 4.0, count: 1 }, sold: { total_sold: 0, total_quantity: 0 }, gia: { current: 0, before_discount: null, discount_percent: 0 }, trangthai: { active: 'hoat_dong', in_stock: false } }
  ];

  const filter = String(req.query?.filter || '').toLowerCase();
  const q = String(req.query?.q || '').trim().toLowerCase();
  const perPage = parseInt(String(req.query?.per_page ?? '20'), 10) || 20;
  const pageRaw = (req.query?.page ?? req.query?.pape);
  const page = parseInt(String(pageRaw ?? '1'), 10) || 1;
  const userId = req.query?.user_id ? String(req.query.user_id) : '';

  // Lọc theo q (ten/slug)
  let list = base.filter(p => !q || String(p.ten).toLowerCase().includes(q) || String(p.slug).toLowerCase().includes(q));

  // Sắp xếp theo filter
  if (filter === 'popular') {
    list = [...list].sort((a, b) => (b.rating?.average || 0) - (a.rating?.average || 0) || (b.rating?.count || 0) - (a.rating?.count || 0));
  } else if (filter === 'latest') {
    // Giả lập latest = giữ nguyên thứ tự gốc (cập nhật mới nhất đã ở đầu)
    list = [...list];
  } else if (filter === 'trending') {
    list = [...list].sort((a, b) => (b.rating?.count || 0) - (a.rating?.count || 0) || (b.rating?.average || 0) - (a.rating?.average || 0));
  } else if (filter === 'matches') {
    // Gợi ý theo user: sắp xếp theo 1 dãy cố định để ổn định UI (demo)
    const preferredOrder = userId ? [8, 1, 10, 14, 9, 2, 15, 3, 16, 18, 7, 20, 12, 11, 5, 13, 19, 17, 4, 6] : [1, 6, 8, 7, 2, 3, 4, 5, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];
    const pos = Object.fromEntries(preferredOrder.map((id, idx) => [id, idx]));
    list = [...list].sort((a, b) => (pos[a.id] ?? 999) - (pos[b.id] ?? 999));
  } else {
    // default tương đương latest
    list = [...list];
  }

  // Phân trang (luôn có - mặc định per_page=20)
  const total = list.length;
  const lastPage = Math.max(1, Math.ceil(total / perPage));
  const currentPage = Math.min(Math.max(1, page), lastPage);
  const start = (currentPage - 1) * perPage;
  const data = list.slice(start, start + perPage);

  const host = req.headers.host || 'localhost:4000';
  const baseUrl = `http://${host}/api/sanphams-all`;
  const mkUrl = (p) => {
    const params = new URLSearchParams();
    params.set('page', String(p));
    params.set('per_page', String(perPage));
    if (filter) params.set('filter', filter);
    if (q) params.set('q', q);
    if (userId) params.set('user_id', userId);
    return `${baseUrl}?${params.toString()}`;
  };

  const linksArr = [
    { url: null, label: '&laquo; Previous', active: false },
    { url: mkUrl(1), label: '1', active: currentPage === 1 },
    ...(lastPage >= 2 ? [{ url: mkUrl(2), label: '2', active: currentPage === 2 }] : []),
    { url: currentPage < lastPage ? mkUrl(currentPage + 1) : null, label: 'Next &raquo;', active: false }
  ];

  return res.json({
    data,
    links: {
      first: mkUrl(1),
      last: mkUrl(lastPage),
      prev: currentPage > 1 ? mkUrl(currentPage - 1) : null,
      next: currentPage < lastPage ? mkUrl(currentPage + 1) : null
    },
    meta: {
      current_page: currentPage,
      from: total === 0 ? null : start + 1,
      last_page: lastPage,
      links: linksArr,
      path: baseUrl,
      per_page: perPage,
      to: total === 0 ? null : Math.min(start + perPage, total),
      total
    }
  });
});

// ------- DANH MỤC SELECTION: GET /api/danhmucs-selection -------
// Hỗ trợ:
// - Không có per_page: trả toàn bộ danh mục (không phân trang)
// - Có per_page: trả thêm links/meta giống các API phân trang khác
// - Chuẩn hóa field: media (từ hinh hoặc slug), trangthai, timestamps
//http://localhost:4000/api/danhmucs-selection không phân
//http://localhost:4000/api/danhmucs-selection?per_page=10 phân trang
server.get('/api/danhmucs-selection', (req, res) => {
  // Lấy danh mục nguồn từ db.json (key: danhmucs_selection)
  const raw = router.db.get('danhmucs_selection').value() || [];
  const now = nowStr();
  const mapped = raw.map(c => {
    const mediaFromHinh = c.hinh ? String(c.hinh).split('/').pop() : '';
    const media = mediaFromHinh || (c.slug ? String(c.slug).replace(/-/g, '_') + '.png' : 'default-danhmuc.png');
    return {
      id: c.id,
      ten: c.ten,
      slug: c.slug,
      media: media || 'default-danhmuc.png',
      trangthai: { active: 'hoat_dong' },
      dayTao: now,
      dayCapNhat: now
    };
  });

  // Không truyền per_page => không phân trang
  const perPageRaw = req.query?.per_page;
  const hasPaging = perPageRaw !== undefined && perPageRaw !== null && perPageRaw !== '';
  if (!hasPaging) {
    return res.json({ data: mapped });
  }

  // Phân trang
  const perPage = parseInt(String(perPageRaw), 10) || 10;
  const page = parseInt(String(req.query?.page ?? '1'), 10) || 1;
  const total = mapped.length;
  const lastPage = Math.max(1, Math.ceil(total / perPage));
  const currentPage = Math.min(Math.max(1, page), lastPage);
  const start = (currentPage - 1) * perPage;
  const data = mapped.slice(start, start + perPage);

  const host = req.headers.host || 'localhost:4000';
  const base = `http://${host}/api/danhmucs-selection`;
  const mkUrl = (p) => `${base}?page=${p}&per_page=${perPage}`;

  const linksArr = [
    { url: null, label: '&laquo; Previous', active: false },
    { url: mkUrl(1), label: '1', active: currentPage === 1 },
    ...(lastPage >= 2 ? [{ url: mkUrl(2), label: '2', active: currentPage === 2 }] : []),
    { url: currentPage < lastPage ? mkUrl(currentPage + 1) : null, label: 'Next &raquo;', active: false }
  ];

  return res.json({
    data,
    links: {
      first: mkUrl(1),
      last: mkUrl(lastPage),
      prev: currentPage > 1 ? mkUrl(currentPage - 1) : null,
      next: currentPage < lastPage ? mkUrl(currentPage + 1) : null
    },
    meta: {
      current_page: currentPage,
      from: total === 0 ? null : start + 1,
      last_page: lastPage,
      links: linksArr,
      path: base,
      per_page: perPage,
      to: total === 0 ? null : Math.min(start + perPage, total),
      total
    }
  });
});

// ------- BANNER QUẢNG CÁO: CHỈ GET (index + filter + optional pagination) -------
//http://localhost:4000/api/bannerquangcaos không phân trang 
//http://localhost:4000/api/bannerquangcaos?per_page=10 phân trang 
//http://localhost:4000/api/bannerquangcaos?q=banner3 tìm kiếm 
server.get('/api/bannerquangcaos', (req, res) => {
  let list = router.db.get('bannerquangcaos').value() || [];

  // Lọc theo q
  const q = String(req.query?.q ?? '').trim().toLowerCase();
  if (q) {
    list = list.filter(b => String(b.hinhanh || '').toLowerCase().includes(q)
      || String(b.tieude || '').toLowerCase().includes(q));
  }

  // Không có per_page => trả tất cả, không phân trang
  const perPageRaw = req.query?.per_page;
  const hasPaging = perPageRaw !== undefined && perPageRaw !== null && perPageRaw !== '';
  if (!hasPaging) {
    return res.json({ data: list });
  }

  // Có per_page => phân trang và trả links/meta
  const perPage = parseInt(String(perPageRaw), 10) || 10;
  const page = parseInt(String(req.query?.page ?? '1'), 10) || 1;
  const total = list.length;
  const lastPage = Math.max(1, Math.ceil(total / perPage));
  const currentPage = Math.min(Math.max(1, page), lastPage);
  const start = (currentPage - 1) * perPage;
  const data = list.slice(start, start + perPage);

  const base = 'http://localhost:4000/api/bannerquangcaos';
  const mkUrl = (p) => `${base}?page=${p}&per_page=${perPage}` + (q ? `&q=${encodeURIComponent(q)}` : '');

  const linksArr = [
    { url: null, label: '&laquo; Previous', active: false },
    { url: mkUrl(1), label: '1', active: currentPage === 1 },
    ...(lastPage >= 2 ? [{ url: mkUrl(2), label: '2', active: currentPage === 2 }] : []),
    { url: currentPage < lastPage ? mkUrl(currentPage + 1) : null, label: 'Next &raquo;', active: false }
  ];

  return res.json({
    data,
    links: {
      first: mkUrl(1),
      last: mkUrl(lastPage),
      prev: currentPage > 1 ? mkUrl(currentPage - 1) : null,
      next: currentPage < lastPage ? mkUrl(currentPage + 1) : null
    },
    meta: {
      current_page: currentPage,
      from: total === 0 ? null : start + 1,
      last_page: lastPage,
      links: linksArr,
      path: base,
      per_page: perPage,
      to: total === 0 ? null : Math.min(start + perPage, total),
      total
    }
  });
});

if (!router.db.has('orders').value()) router.db.set('orders', []).write();
server.post('/api/vnpay/create', (req, res) => {
  try {
    const cart = Array.isArray(req.body?.cart) ? req.body.cart : [];
    const amount = Number(req.body?.amount ?? cart.reduce((s, it) => s + ((it?.gia?.current ?? it?.price ?? 0) * (it?.quantity ?? it?.qty ?? 1)), 0)) || 0;
    const orderId = String(Date.now());
    const order = {
      id: orderId,
      user_id: resolveUserIdFromReq(req) ?? 'guest',
      items: cart,
      amount,
      status: 'pending',
      paymentMethod: 'online',
      created_at: new Date().toISOString()
    };
    router.db.get('orders').push(order).write();

    const returnUrl = String(req.body?.returnUrl || `http://localhost:3000/hoan-tat-thanh-toan`);
    const host = process.env.MOCK_VNPAY_HOST || `${req.protocol}://${req.get('host')}`;
    const vnpUrl = `${host}/mock/vnpay/pay?order_id=${encodeURIComponent(orderId)}&return_url=${encodeURIComponent(returnUrl)}`;

    return res.json({ status: true, data: { vnpUrl, orderId } });
  } catch (err) {
    console.error('[mock] vnpay create error', err);
    return res.status(500).json({ status: false, message: 'mock vnpay error' });
  }
});

// GET: mock VNPAY payment page (shows QR / Pay button)
server.get('/mock/vnpay/pay', (req, res) => {
  const order_id = String(req.query?.order_id || '');
  const return_url = String(req.query?.return_url || `http://localhost:3000/hoan-tat-thanh-toan`);

  // Lấy info đơn từ db.json
  const orders = router.db.get('orders');
  const order = orders.find({ id: order_id }).value();
  const amount = Number(order?.amount || 0);

  const formattedAmount = new Intl.NumberFormat('vi-VN').format(amount);

  // Build link VietQR
  const bankCode = VQR_BANK_CODE;
  const accountNo = VQR_ACCOUNT_NO;
  const accountName = VQR_ACCOUNT_NAME;

  const encodedAccountName = encodeURIComponent(accountName);
  const desc = encodeURIComponent(`DH${order_id}`); // nội dung chuyển khoản
  const qrUrl = `https://img.vietqr.io/image/${bankCode}-${accountNo}-compact2.png` +
    `?amount=${amount}&addInfo=${desc}&accountName=${encodedAccountName}`;

  res.send(`
    <html>
      <head><meta charset="utf-8"/><title>Thanh toán QR</title></head>
      <body style="font-family:Arial,Helvetica,sans-serif;padding:40px;">
        <h2>Thanh toán qua QR (mock VNPAY)</h2>

        <p>Mã đơn: <b>${order_id}</b></p>
        <p>Số tiền: <b>${formattedAmount} đ</b></p>

        <div style="margin:24px 0;">
          <p>Ngân hàng: <b>${bankCode}</b></p>
          <p>Số tài khoản: <b>${accountNo}</b></p>
          <p>Chủ tài khoản: <b>${accountName}</b></p>
        </div>

        <div style="margin:24px 0;">
          <img src="${qrUrl}" alt="QR chuyển khoản" style="width:260px;height:260px;border:1px solid #ccc;border-radius:8px;"/>
        </div>

        <p>Hãy mở app ngân hàng, quét QR và xác nhận chuyển khoản.</p>

        <form method="POST" action="/mock/vnpay/complete">
          <input type="hidden" name="order_id" value="${order_id}" />
          <input type="hidden" name="return_url" value="${return_url}" />
          <p>
            <button type="submit" style="padding:12px 20px;font-size:16px">
              Tôi đã chuyển khoản
            </button>
          </p>
        </form>
      </body>
    </html>
  `);
});

// POST: hoàn tất thanh toán (mock) -> update order và redirect về return_url (vnp_ReturnUrl)
server.post('/mock/vnpay/complete', (req, res) => {
  try {
    const order_id = req.body?.order_id || req.query?.order_id;
    const return_url = req.body?.return_url || req.query?.return_url || `http://localhost:3000/hoan-tat-thanh-toan`;
    if (!order_id) return res.status(400).send('missing order_id');

    const orders = router.db.get('orders');
    const found = orders.find({ id: String(order_id) }).value();
    if (!found) return res.status(404).send('order not found');

    orders.find({ id: String(order_id) }).assign({
      status: 'paid',
      paid_at: new Date().toISOString()
    }).write();

    // Optionally simulate IPN callback (not required for redirect flow)
    // Redirect back to merchant return URL with query params VNPAY would send
    const redirectTo = `${return_url}?vnp_ResponseCode=00&order_id=${encodeURIComponent(order_id)}&vnp_TransactionStatus=00`;
    return res.redirect(302, redirectTo);
  } catch (err) {
    console.error('[mock] vnpay complete error', err);
    return res.status(500).send('error');
  }
});

// GET order status (used by hoan-tat-thanh-toan page)
server.get('/api/orders/:id', (req, res) => {
  const id = String(req.params.id);
  const order = router.db.get('orders').find({ id }).value();
  if (!order) return res.json({ status: false, message: 'Order not found' });
  return res.json({ status: true, data: order });
});

// PATCH update order (status, address, tracking, etc.)
server.patch(['/api/orders/:id', '/api/tai-khoan/donhangs/:id', '/api/toi/donhang/:id', '/api/donhang/:id'], express.json(), (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!router.db.has('orders').value()) router.db.set('orders', []).write();
    const orders = router.db.get('orders');
    const found = orders.find({ id }).value();
    if (!found) return res.status(404).json({ status: false, message: 'Not found' });
    const updates = req.body || {};
    orders.find({ id }).assign({ ...updates, updated_at: new Date().toISOString() }).write();
    const after = orders.find({ id }).value();
    console.debug('[mock] order patched', after);
    return res.json({ status: true, data: after });
  } catch (err) {
    console.error('[mock] patch order error', err);
    return res.status(500).json({ status: false });
  }
});

// POST cancel endpoint for convenience
server.post(['/api/orders/:id/cancel', '/api/tai-khoan/donhangs/:id/cancel', '/api/toi/donhang/:id/cancel'], express.json(), (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!router.db.has('orders').value()) router.db.set('orders', []).write();
    const orders = router.db.get('orders');
    const found = orders.find({ id }).value();
    if (!found) return res.status(404).json({ status: false, message: 'Not found' });
    orders.find({ id }).assign({ status: 'cancelled', updated_at: new Date().toISOString() }).write();
    const after = orders.find({ id }).value();
    console.debug('[mock] order cancelled', after);
    return res.json({ status: true, data: after });
  } catch (err) {
    console.error('[mock] cancel order error', err);
    return res.status(500).json({ status: false });
  }
});

// ===== config người thụ hưởng =====
// const VQR_BANK_CODE   = process.env.VQR_BANK_CODE   || '970422';   // tên ngân hàng config theo vietqr.io
// const VQR_ACCOUNT_NO  = process.env.VQR_ACCOUNT_NO  || '288678888';       // số TK của bạn
// const VQR_ACCOUNT_NAME = process.env.VQR_ACCOUNT_NAME || 'LE QUANG HUY'; // KHÔNG DẤU, IN HOA

const APP_URL = process.env.APP_URL || 'http://localhost:4000';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const VNP_TMNCODE = process.env.VNP_TMNCODE || '';
const VNP_SECRET = process.env.VNP_SECRET || '';
// const VNP_TEST_MODE = String(process.env.VNP_TEST_MODE || 'true').toLowerCase() !== 'false';

const hasRealVnp = !!(VNP_TMNCODE && VNP_SECRET);
const vnpay = hasRealVnp
  ? new VNPay({
    tmnCode: VNP_TMNCODE,
    secureSecret: VNP_SECRET,
    testMode: true, // sandbox
  })
  : null;

/** Helper: IP client */
function getClientIp(req) {
  return (
    req.headers['x-forwarded-for'] ||
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    req.ip ||
    '127.0.0.1'
  );
}

function sortObject(obj) {
  const sorted = {};
  const keys = Object.keys(obj).sort();
  keys.forEach(key => sorted[key] = obj[key]);
  return sorted;
}

/** Bảo đảm có collection orders */
if (!router.db.has('orders').value()) router.db.set('orders', []).write();

/**
 * POST /api/vnpay/create
 * Body: { cart: [], amount: number, paymentMethod?: 'online'|'cod', returnUrl?: string }
 * - online: tạo order + build VNPAY URL (real nếu có TMNCODE/SECRET, ngược lại mock)
 * - cod:    tạo order COD và trả về orderId để FE redirect đến trang hoàn tất
 */

server.post('/api/vnpay/create', (req, res) => {
  try {
    const { cart, amount: rawAmount, returnUrl } = req.body || {};
    const amount = Number(rawAmount ?? 0) || 0;

    // 1. Tạo Order Mock trong db.json
    const orderId = String(Date.now());
    const order = {
      id: orderId,
      user_id: resolveUserIdFromReq(req) ?? 'guest',
      items: cart,
      amount,
      status: 'pending',
      paymentMethod: 'online',
      created_at: new Date().toISOString()
    };
    if (!router.db.has('orders').value()) router.db.set('orders', []).write();
    router.db.get('orders').push(order).write();


    process.env.TZ = 'Asia/Ho_Chi_Minh';
    const createDate = moment(new Date()).format('YYYYMMDDHHmmss');
    const ipAddr = getClientIp(req);
    const currCode = 'VND';
    const locale = 'vn';
    const querystring = require('qs');
    const crypto = require("crypto");

    let vnp_Params = {};
    vnp_Params['vnp_Version'] = '2.1.0';
    vnp_Params['vnp_Command'] = 'pay';
    vnp_Params['vnp_TmnCode'] = VNPAY_TMNCODE; // Dùng biến môi trường
    vnp_Params['vnp_Locale'] = locale;
    vnp_Params['vnp_CurrCode'] = currCode;
    vnp_Params['vnp_TxnRef'] = orderId;
    vnp_Params['vnp_OrderInfo'] = 'Thanh toan cho ma GD:' + orderId;
    vnp_Params['vnp_OrderType'] = 'other';
    vnp_Params['vnp_Amount'] = amount * 100; // * 100
    vnp_Params['vnp_ReturnUrl'] = VNPAY_RETURN_URL; // Dùng VNPAY_RETURN_URL từ .env
    vnp_Params['vnp_IpAddr'] = ipAddr;
    vnp_Params['vnp_CreateDate'] = createDate;

    vnp_Params = sortObject(vnp_Params);

    let signData = querystring.stringify(vnp_Params, { encode: false });
    let hmac = crypto.createHmac("sha512", VNPAY_HASH_SECRET); // Dùng secret key
    let signed = hmac.update(new Buffer(signData, 'utf-8')).digest("hex");
    vnp_Params['vnp_SecureHash'] = signed;

    const vnpUrl = VNPAY_URL + '?' + querystring.stringify(vnp_Params, { encode: false });

    console.log('[mock] Generated VNPAY URL:', vnpUrl);

    // Frontend sẽ nhận URL này và tự redirect
    return res.json({ status: true, data: { vnpUrl, orderId } });
  } catch (err) {
    console.error('[mock] vnpay create error', err);
    return res.status(500).json({ status: false, message: 'mock vnpay error' });
  }
});


/**
 * GET /api/vnpay/return
 * VNPAY redirect về đây sau khi khách thanh toán -> verify rồi redirect sang FE /hoan-tat-thanh-toan
 */
server.get('/api/vnpay/return', (req, res) => {
  try {
    const vnp_Params = req.query;
    const secureHash = vnp_Params['vnp_SecureHash'];
    const orderId = vnp_Params['vnp_TxnRef'];
    const responseCode = vnp_Params['vnp_ResponseCode'] || '99';

    // Bỏ qua check hash trong mock, chỉ xử lý logic status
    const isSuccess = responseCode === '00';
    const orders = router.db.get('orders');

    if (orderId) {
      const existed = orders.find({ id: orderId }).value();
      if (existed) {
        orders.find({ id: orderId }).assign({
          status: isSuccess ? 'paid' : 'failed',
          paid_at: new Date().toISOString()
        }).write();
      }
    }

    // Redirect về Frontend. Frontend của bạn dùng path /hoan-tat-thanh-toan
    // Backend thực tế redirect về /api/course/success hoặc /api/course/failed
    // Ta sẽ redirect về đường dẫn mà Frontend đang mong đợi.

    const targetUrl = isSuccess
      ? 'http://localhost:3000/hoan-tat-thanh-toan?result=success&order_id=' + orderId
      : 'http://localhost:3000/hoan-tat-thanh-toan?result=failed&order_id=' + orderId;

    return res.redirect(302, targetUrl);
  } catch (err) {
    console.error('[mock] vnpay return error', err);
    return res.status(500).send('return error');
  }
});


/**
 * IPN: VNPay server -> backend (không dành cho browser)
 * VNP yêu cầu phản hồi dạng { RspCode, Message }.
 */
server.post('/api/vnpay/ipn', (req, res) => {
  try {
    let isSuccess = false;
    let txnRef = String(req.body?.vnp_TxnRef || req.query?.vnp_TxnRef || '');

    if (hasRealVnp && vnpay) {
      const verification = vnpay.verifyIpnCall(Object.keys(req.body || {}).length ? req.body : req.query);
      isSuccess = !!verification.isSuccess;
      txnRef = String(verification?.vnp_TxnRef || txnRef || '');
    } else {
      // mock: coi như thành công nếu có order id
      isSuccess = !!txnRef;
    }

    if (txnRef) {
      const orders = router.db.get('orders');
      const existed = orders.find({ id: txnRef }).value();
      if (existed) {
        orders
          .find({ id: txnRef })
          .assign({
            status: isSuccess ? 'paid' : 'failed',
            paid_at: isSuccess ? new Date().toISOString() : null,
          })
          .write();
      }
    }

    return res.status(200).json({ RspCode: isSuccess ? '00' : '01', Message: isSuccess ? 'success' : 'fail' });
  } catch (err) {
    console.error('[vnpay] ipn error', err);
    return res.status(500).json({ RspCode: '99', Message: 'error' });
  }
});

/**
 * GET /api/order/status  -> FE đang gọi để hiển thị kết quả
 * - Nếu có ?order_id=... -> trả chi tiết đơn đó
 * - Nếu không, trả đơn gần nhất của user
 */
server.get('/api/order/status', (req, res) => {
  const uid = resolveUserIdFromReq(req) ?? 'guest';
  const orderId = String(req.query?.order_id || '');

  let order = null;
  if (orderId) {
    order = router.db.get('orders').find({ id: orderId }).value();
  } else {
    const list = router.db.get('orders').filter({ user_id: String(uid) }).value() || [];
    order = list.sort((a, b) => Number(b.id) - Number(a.id))[0] || null;
  }
  if (!order) return res.json({ status: false, message: 'Order not found' });

  const normalized =
    order.paymentMethod === 'cod'
      ? 'cash_on_delivery'
      : order.status === 'paid'
        ? 'online_payment'
        : 'pending';

  return res.json({
    status: true,
    data: {
      id: order.id,
      status: normalized,
      rawStatus: order.status,
      amount: order.amount,
      paymentMethod: order.paymentMethod,
      paid_at: order.paid_at || null,
    },
  });
});

function mapOrderToApiDonHang(o) {
  return {
    id: o.id,
    madon: o.madon || String(o.id),
    thanhtien: o.thanhtien ?? o.total ?? 0,
    trangthai: o.trangthai || "Không rõ",
    trangthaithanhtoan: o.trangthaithanhtoan || (o.paid ? "Đã thanh toán" : "Chưa thanh toán"),
    created_at: o.created_at || new Date().toISOString(),
    chitietdonhang: Array.isArray(o.chitietdonhang)
      ? o.chitietdonhang.map(it => ({
        id: it.id,
        soluong: it.soluong ?? it.quantity ?? 1,
        dongia: it.dongia ?? it.price ?? 0,
        bienthe: {
          sanpham: {
            ten: it.bienthe?.sanpham?.ten ?? it.name ?? "Sản phẩm",
            hinhanh: it.bienthe?.sanpham?.hinhanh ?? it.image ?? "/assets/images/thumbs/default.png"
          }
        }
      }))
      : []
  };
}

/**
 * GET /api/toi/theodoi-donhang
 * trả ApiGroup[] (nhóm theo trạng thái) giống kiểu frontend mong muốn
 */
server.get('/api/toi/theodoi-donhang', (req, res) => {
  try {
    const db = router.db; // lowdb
    const all = db.get('orders').value() || [];

    // group orders by their trangthai (tiếng Việt)
    const groupsMap = new Map();
    for (const o of all) {
      const key = o.trangthai || 'Khác';
      if (!groupsMap.has(key)) groupsMap.set(key, []);
      groupsMap.get(key).push(mapOrderToApiDonHang(o));
    }

    const groups = Array.from(groupsMap.entries()).map(([label, donhang]) => ({
      label,
      trangthai: label,
      donhang
    }));

    return res.json({ status: true, message: "OK", data: groups });
  } catch (err) {
    console.error('[mock] /api/toi/theodoi-donhang error', err);
    return res.status(500).json({ status: false, message: 'Internal error' });
  }
});

/**
 * Backwards-compatible endpoints used by other parts of app.
 * - /api/tai-khoan/donhangs  -> trả danh sách đơn hàng phẳng (mảng ApiDonHang)
 * - /api/donhang/:id hoặc /api/toi/donhang/:id -> trả 1 ApiDonHang
 */
server.get('/api/tai-khoan/donhangs', (req, res) => {
  try {
    const db = router.db;
    const all = db.get('orders').value() || [];
    const mapped = all.map(mapOrderToApiDonHang);
    return res.json({ status: true, data: mapped });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ status: false, message: 'Internal error' });
  }
});

server.get(['/api/toi/donhang/:id', '/api/donhang/:id', '/api/orders/:id'], (req, res) => {
  try {
    const id = Number(req.params.id);
    const db = router.db;
    const o = db.get('orders').find({ id }).value();
    if (!o) return res.status(404).json({ status: false, message: 'Not found' });
    return res.json({ status: true, data: mapOrderToApiDonHang(o) });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ status: false, message: 'Internal error' });
  }
});

/**
 * When client requests a POST/PUT that modifies orders (e.g. cancel),
 * keep original behavior but also update 'orders' collection so
 * the frontend orders page sees the change.
 */
server.patch('/api/orders/:id', (req, res) => {
  try {
    const id = Number(req.params.id);
    const db = router.db;
    const o = db.get('orders').find({ id }).value();
    if (!o) return res.status(404).json({ status: false, message: 'Not found' });
    const payload = req.body || {};
    // accept field 'trangthai' (VN) or 'status'
    const updates = {};
    if (payload.trangthai) updates.trangthai = payload.trangthai;
    if (payload.status) updates.trangthai = payload.status;
    db.get('orders').find({ id }).assign(updates).write();
    return res.json({ status: true, data: mapOrderToApiDonHang(db.get('orders').find({ id }).value()) });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ status: false, message: 'Internal error' });
  }
});

server.use('/uploads', express.static(UPLOAD_DIR));
server.use(middlewares);
server.use(jsonServer.bodyParser);
server.use(rewriter);
server.use(router);

const PORT = 4000; // hoặc 4000 nếu bạn thích
server.listen(PORT, () => {
  console.log(`JSON Server running on http://localhost:${PORT}`);
});
