import prisma from '../prisma';

export async function getSettings() {
  return prisma.settings.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1 },
  });
}

export async function updateSettings(data: {
  referralUrl?: string;
  channelUrl?: string;
  promoCode?: string;
  botName?: string;
  supportContact?: string;
}) {
  return prisma.settings.upsert({
    where: { id: 1 },
    update: data,
    create: { id: 1, ...data },
  });
}
