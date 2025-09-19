import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 10,
  duration: '30s',
};

export default function () {
  const payload = JSON.stringify({ items: [{ sku: 'ABC', qty: 1 }], payment: { amount: 10 } });
  const params = { headers: { 'Content-Type': 'application/json' } };
  const res = http.post('http://localhost:8080/orders', payload, params);
  check(res, { 'status is 200/201': (r) => r.status === 200 || r.status === 201 });
  sleep(1);
}
