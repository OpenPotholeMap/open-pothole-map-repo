import { Router } from 'express';

export const UserRoutes = Router();

UserRoutes.get('/:userId', (req, res) => {
  res.send('User get route is working');
});

UserRoutes.post('/register', (req, res) => {
  res.send('User registration route is working');
});

UserRoutes.post('/login', (req, res) => {
  res.send('User login route is working');
});

UserRoutes.put('/:userId', (req, res) => {
  res.send('User update route is working');
});

UserRoutes.delete('/:userId', (req, res) => {
  res.send('User delete route is working');
});
