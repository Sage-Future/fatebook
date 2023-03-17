import { VercelRequest, VercelResponse } from '@vercel/node';

const foobar = (req: VercelRequest, res: VercelResponse): void => {
  res.json({ foo: 'foo', bar: 'bar' });
};

export default foobar;
