import { NextResponse } from 'next/server';
import { mkdir, readFile, writeFile } from 'fs/promises';
import path from 'path';
import { productsData, whatsappNumber } from '../../data/constants';

export const dynamic = 'force-dynamic';

const storageDir = path.join(process.cwd(), 'storage');
const storageFile = path.join(storageDir, 'admin-state.json');

const defaultConfig = {
  siteName: '0880',
  whatsappNumber,
  currency: 'MXN',
  hero: {
    title1: 'Arte en',
    title2: 'cada puntada.',
    subtitle: 'Lujo Silencioso • Hecho a Mano • León, Gto.',
  },
  theme: {
    primaryColor: '#b45309',
    backgroundColor: '#fafafa',
  },
};

const defaultState = {
  config: defaultConfig,
  products: productsData,
};

function normalizeState(data) {
  const incomingConfig = data?.config || {};

  return {
    config: {
      ...defaultConfig,
      ...incomingConfig,
      hero: {
        ...defaultConfig.hero,
        ...(incomingConfig.hero || {}),
      },
      theme: {
        ...defaultConfig.theme,
        ...(incomingConfig.theme || {}),
      },
    },
    products: Array.isArray(data?.products) && data.products.length ? data.products : productsData,
  };
}

async function readState() {
  try {
    const raw = await readFile(storageFile, 'utf8');
    return normalizeState(JSON.parse(raw));
  } catch {
    return defaultState;
  }
}

export async function GET() {
  const state = await readState();
  return NextResponse.json(state);
}

export async function POST(request) {
  try {
    const body = await request.json();
    const state = normalizeState(body);

    await mkdir(storageDir, { recursive: true });
    await writeFile(storageFile, JSON.stringify(state, null, 2), 'utf8');

    return NextResponse.json({ ok: true, state });
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid payload' }, { status: 400 });
  }
}
