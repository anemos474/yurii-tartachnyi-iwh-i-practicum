require('dotenv').config();
const express = require('express');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// ===== HubSpot config =====
const HUBSPOT_TOKEN = process.env.HUBSPOT_TOKEN;
const OBJECT_TYPE = process.env.HUBSPOT_OBJECT;

if (!HUBSPOT_TOKEN || !OBJECT_TYPE) {
  console.error('❗ Set HUBSPOT_TOKEN and HUBSPOT_OBJECT in your .env');
  process.exit(1);
}

// ===== Express setup =====
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use('/public', express.static(path.join(__dirname, 'public')));

// ===== Axios instance =====
const hs = axios.create({
  baseURL: 'https://api.hubapi.com',
  headers: {
    Authorization: `Bearer ${HUBSPOT_TOKEN}`,
    'Content-Type': 'application/json'
  },
  timeout: 15000
});

// Helper: get all records
async function fetchObjects(limit = 50) {
  const props = ['name','bio','category'];
  const res = await hs.get(`/crm/v3/objects/${OBJECT_TYPE}`, {
    params: {
      properties: props.join(','),
      limit
    }
  });
  return res.data.results || [];
}

// Helper: create one record
async function createObject(data) {
  const properties = {
    name: data.name,
    bio: data.bio,
    category: data.category
  };
  const res = await hs.post(`/crm/v3/objects/${OBJECT_TYPE}`, { properties });
  return res.data;
}

// ===== Routes =====
// GET "/" — homepage: table with records
app.get('/', async (req, res) => {
  try {
    const items = await fetchObjects();
    res.status(200).render('homepage', {
      title: 'Homepage | Integrating With HubSpot I Practicum',
      items
    });
  } catch (err) {
    console.error(err?.response?.data || err.message);
    res.status(500).send('Error fetching records from HubSpot.');
  }
});

// GET "/update-cobj" — render form
app.get('/update-cobj', (req, res) => {
  res.status(200).render('updates', {
    title: 'Update Custom Object Form | Integrating With HubSpot I Practicum'
  });
});

// POST "/update-cobj" — create record, then redirect to "/"
app.post('/update-cobj', async (req, res) => {
  try {
    await createObject(req.body);
    res.redirect('/');
  } catch (err) {
    console.error(err?.response?.data || err.message);
    res.status(500).send('Error creating record in HubSpot.');
  }
});

// ===== Start server =====
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
