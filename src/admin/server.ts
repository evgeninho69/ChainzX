import express from 'express';
import path from 'path';
import adminApi from './api';

const app = express();
const PORT = process.env.ADMIN_PORT || 3001;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/api', adminApi);

app.listen(PORT, () => {
  console.log(`Admin panel running on http://localhost:${PORT}`);
});

