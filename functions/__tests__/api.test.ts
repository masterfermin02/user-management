import request from 'supertest';
import { __setNextFetchResponse } from '../__mocks__/undici';
import { _app as app } from '../src/index';
import admin from 'firebase-admin';
import { resolveZip } from '../src/helper';

jest.mock('../src/helper', () => ({
  resolveZip: jest.fn(),
}));

describe('User API', () => {
  beforeAll(() => {
    // ensure admin is initialized (mock)
    (admin.initializeApp as jest.Mock).mockReturnValue({});
  });

  test('POST /users creates and enriches user', async () => {
    // Mock OpenWeather response
    (resolveZip as jest.Mock).mockResolvedValue({
      lat: 40.75,
      lon: -73.99,
      timezone: 'America/New_York',
      tzOffsetSec: -14400,
    });

    const res = await request(app)
      .post('/users')
      .send({ name: 'Alice', zip: '10001' })
      .expect(201);

    expect(res.body).toMatchObject({
      name: 'Alice',
      zip: '10001',
      lat: 40.75,
      lon: -73.99,
      timezone: 'America/New_York',
      tzOffsetSec: -14400
    });

    expect(res.body).toHaveProperty('id');
    expect(res.body).toHaveProperty('createdAt');
    expect(res.body).toHaveProperty('updatedAt');
  });
});
