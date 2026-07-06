import { PrismaClient, Role, PropertyType, ListingType, PropertyStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const DEV_PASSWORD = 'Password123!';

interface SeedProperty {
  id: string;
  title: string;
  propertyType: PropertyType;
  listingType: ListingType;
  status: PropertyStatus;
  price: number;
  city: string;
  district: string;
  neighborhood: string;
  addressText: string;
  latitude: number;
  longitude: number;
  ownerName: string;
  ownerPhone: string;
  roomCount?: string;
  grossM2?: number;
  netM2?: number;
  buildingAge?: number;
  floor?: number;
  totalFloors?: number;
  heatingType?: string;
  monthlyFee?: number;
  isFurnished?: boolean;
  zoningStatus?: string;
  blockNo?: string;
  parcelNo?: string;
}

function konyaProperties(orgId: string): SeedProperty[] {
  return [
    {
      id: `${orgId}-prop-1`,
      title: 'Merkezi Konumda 3+1 Daire',
      propertyType: PropertyType.APARTMENT,
      listingType: ListingType.SALE,
      status: PropertyStatus.ACTIVE,
      price: 3250000,
      city: 'Konya',
      district: 'Selçuklu',
      neighborhood: 'Bosna Hersek',
      addressText: 'Bosna Hersek Mah. 123. Sk. No:4',
      latitude: 37.8853,
      longitude: 32.4933,
      ownerName: 'Ahmet Yılmaz',
      ownerPhone: '05321112233',
      roomCount: '3+1',
      grossM2: 145,
      netM2: 125,
      buildingAge: 5,
      floor: 4,
      totalFloors: 8,
      heatingType: 'Doğalgaz (Kombi)',
      monthlyFee: 850,
      isFurnished: false,
    },
    {
      id: `${orgId}-prop-2`,
      title: 'Kiralık Eşyalı Stüdyo',
      propertyType: PropertyType.APARTMENT,
      listingType: ListingType.RENT,
      status: PropertyStatus.ACTIVE,
      price: 12500,
      city: 'Konya',
      district: 'Meram',
      neighborhood: 'Yaka',
      addressText: 'Yaka Mah. Gül Sk. No:12',
      latitude: 37.8628,
      longitude: 32.4826,
      ownerName: 'Fatma Demir',
      ownerPhone: '05339998877',
      roomCount: '1+0',
      grossM2: 55,
      netM2: 48,
      buildingAge: 10,
      floor: 2,
      totalFloors: 5,
      heatingType: 'Merkezi',
      monthlyFee: 300,
      isFurnished: true,
    },
    {
      id: `${orgId}-prop-3`,
      title: 'Ana Cadde Üzeri Dükkan',
      propertyType: PropertyType.SHOP,
      listingType: ListingType.RENT,
      status: PropertyStatus.ACTIVE,
      price: 28000,
      city: 'Konya',
      district: 'Karatay',
      neighborhood: 'Fevzi Çakmak',
      addressText: 'Fevzi Çakmak Mah. Ana Cad. No:56',
      latitude: 37.8747,
      longitude: 32.5218,
      ownerName: 'Mehmet Öz',
      ownerPhone: '05421234567',
      grossM2: 90,
      floor: 0,
      totalFloors: 3,
      monthlyFee: 500,
    },
    {
      id: `${orgId}-prop-4`,
      title: 'Yatırımlık Tarla',
      propertyType: PropertyType.LAND,
      listingType: ListingType.SALE,
      status: PropertyStatus.ACTIVE,
      price: 950000,
      city: 'Konya',
      district: 'Selçuklu',
      neighborhood: 'Dumlupınar',
      addressText: 'Dumlupınar Mah. Tarla Yolu',
      latitude: 37.9102,
      longitude: 32.4611,
      ownerName: 'Hasan Kaya',
      ownerPhone: '05051112233',
      grossM2: 5000,
      zoningStatus: 'Tarım Arazisi',
      blockNo: '112',
      parcelNo: '45',
    },
    {
      id: `${orgId}-prop-5`,
      title: 'Bahçeli Müstakil Villa',
      propertyType: PropertyType.VILLA,
      listingType: ListingType.SALE,
      status: PropertyStatus.PASSIVE,
      price: 8750000,
      city: 'Konya',
      district: 'Meram',
      neighborhood: 'Alakova',
      addressText: 'Alakova Mah. Villa Sk. No:7',
      latitude: 37.835,
      longitude: 32.4517,
      ownerName: 'Ayşe Şahin',
      ownerPhone: '05061234567',
      roomCount: '5+2',
      grossM2: 320,
      netM2: 280,
      buildingAge: 8,
      floor: 0,
      totalFloors: 2,
      heatingType: 'Yerden Isıtma',
      isFurnished: false,
    },
    {
      id: `${orgId}-prop-6`,
      title: 'Plaza İçinde Ofis',
      propertyType: PropertyType.OFFICE,
      listingType: ListingType.RENT,
      status: PropertyStatus.ACTIVE,
      price: 18000,
      city: 'Konya',
      district: 'Selçuklu',
      neighborhood: 'Feritpaşa',
      addressText: 'Feritpaşa Mah. Plaza Cad. No:3 Kat:6',
      latitude: 37.8801,
      longitude: 32.4977,
      ownerName: 'Kemal Arslan',
      ownerPhone: '05071234567',
      grossM2: 110,
      netM2: 100,
      floor: 6,
      totalFloors: 12,
      heatingType: 'Merkezi (VRV)',
      monthlyFee: 1200,
    },
    {
      id: `${orgId}-prop-7`,
      title: 'Satılık Apartman',
      propertyType: PropertyType.BUILDING,
      listingType: ListingType.SALE,
      status: PropertyStatus.SOLD,
      price: 15500000,
      city: 'Konya',
      district: 'Karatay',
      neighborhood: 'Şeker',
      addressText: 'Şeker Mah. Apartman Sk. No:9',
      latitude: 37.8695,
      longitude: 32.5301,
      ownerName: 'Zeynep Aydın',
      ownerPhone: '05081234567',
      grossM2: 900,
      totalFloors: 6,
      buildingAge: 15,
    },
  ];
}

function istanbulProperties(orgId: string): SeedProperty[] {
  return [
    {
      id: `${orgId}-prop-1`,
      title: 'Boğaz Manzaralı 4+1 Rezidans',
      propertyType: PropertyType.APARTMENT,
      listingType: ListingType.SALE,
      status: PropertyStatus.ACTIVE,
      price: 24500000,
      city: 'İstanbul',
      district: 'Beşiktaş',
      neighborhood: 'Levent',
      addressText: 'Levent Mah. Rezidans Cad. No:1',
      latitude: 41.0815,
      longitude: 29.0094,
      ownerName: 'Cem Yıldız',
      ownerPhone: '05329876543',
      roomCount: '4+1',
      grossM2: 210,
      netM2: 185,
      buildingAge: 3,
      floor: 12,
      totalFloors: 20,
      heatingType: 'Merkezi (VRV)',
      monthlyFee: 3500,
      isFurnished: true,
    },
    {
      id: `${orgId}-prop-2`,
      title: 'Kiralık 2+1 Daire',
      propertyType: PropertyType.APARTMENT,
      listingType: ListingType.RENT,
      status: PropertyStatus.ACTIVE,
      price: 32000,
      city: 'İstanbul',
      district: 'Kadıköy',
      neighborhood: 'Caferağa',
      addressText: 'Caferağa Mah. Moda Cad. No:22',
      latitude: 40.9847,
      longitude: 29.0281,
      ownerName: 'Selin Kurt',
      ownerPhone: '05339871122',
      roomCount: '2+1',
      grossM2: 95,
      netM2: 82,
      buildingAge: 20,
      floor: 3,
      totalFloors: 5,
      heatingType: 'Doğalgaz (Kombi)',
      monthlyFee: 600,
      isFurnished: false,
    },
    {
      id: `${orgId}-prop-3`,
      title: 'AVM Karşısı Dükkan',
      propertyType: PropertyType.SHOP,
      listingType: ListingType.RENT,
      status: PropertyStatus.ACTIVE,
      price: 65000,
      city: 'İstanbul',
      district: 'Şişli',
      neighborhood: 'Mecidiyeköy',
      addressText: 'Mecidiyeköy Mah. Büyükdere Cad. No:100',
      latitude: 41.0669,
      longitude: 29.0088,
      ownerName: 'Burak Er',
      ownerPhone: '05421239876',
      grossM2: 150,
      floor: 0,
      totalFloors: 4,
      monthlyFee: 2000,
    },
    {
      id: `${orgId}-prop-4`,
      title: 'İmarlı Arsa',
      propertyType: PropertyType.LAND,
      listingType: ListingType.SALE,
      status: PropertyStatus.ACTIVE,
      price: 42000000,
      city: 'İstanbul',
      district: 'Beykoz',
      neighborhood: 'Çubuklu',
      addressText: 'Çubuklu Mah. Arsa Yolu',
      latitude: 41.0958,
      longitude: 29.0764,
      ownerName: 'Nihat Polat',
      ownerPhone: '05051239988',
      grossM2: 2500,
      zoningStatus: 'Konut İmarlı',
      blockNo: '78',
      parcelNo: '12',
    },
    {
      id: `${orgId}-prop-5`,
      title: 'Sahil Şeridi Villa',
      propertyType: PropertyType.VILLA,
      listingType: ListingType.SALE,
      status: PropertyStatus.PASSIVE,
      price: 68000000,
      city: 'İstanbul',
      district: 'Sarıyer',
      neighborhood: 'Tarabya',
      addressText: 'Tarabya Mah. Sahil Yolu No:5',
      latitude: 41.1281,
      longitude: 29.0631,
      ownerName: 'Deniz Aksoy',
      ownerPhone: '05061239988',
      roomCount: '6+2',
      grossM2: 450,
      netM2: 400,
      buildingAge: 12,
      floor: 0,
      totalFloors: 3,
      heatingType: 'Yerden Isıtma',
      isFurnished: true,
    },
    {
      id: `${orgId}-prop-6`,
      title: 'Merkezi Plazada Kiralık Ofis',
      propertyType: PropertyType.OFFICE,
      listingType: ListingType.RENT,
      status: PropertyStatus.ACTIVE,
      price: 55000,
      city: 'İstanbul',
      district: 'Şişli',
      neighborhood: 'Maslak',
      addressText: 'Maslak Mah. Plaza Cad. No:8 Kat:15',
      latitude: 41.1105,
      longitude: 29.0219,
      ownerName: 'Gökhan Tunç',
      ownerPhone: '05071239988',
      grossM2: 180,
      netM2: 165,
      floor: 15,
      totalFloors: 25,
      heatingType: 'Merkezi (VRV)',
      monthlyFee: 4500,
    },
    {
      id: `${orgId}-prop-7`,
      title: 'Satılık Bina',
      propertyType: PropertyType.BUILDING,
      listingType: ListingType.SALE,
      status: PropertyStatus.SOLD,
      price: 95000000,
      city: 'İstanbul',
      district: 'Kadıköy',
      neighborhood: 'Fenerbahçe',
      addressText: 'Fenerbahçe Mah. Bina Sk. No:14',
      latitude: 40.9678,
      longitude: 29.0397,
      ownerName: 'Emre Çelik',
      ownerPhone: '05081239988',
      grossM2: 1400,
      totalFloors: 8,
      buildingAge: 18,
    },
    {
      id: `${orgId}-prop-8`,
      title: 'Öğrenciye Uygun 1+1 Daire',
      propertyType: PropertyType.APARTMENT,
      listingType: ListingType.RENT,
      status: PropertyStatus.RENTED,
      price: 18000,
      city: 'İstanbul',
      district: 'Beyoğlu',
      neighborhood: 'Cihangir',
      addressText: 'Cihangir Mah. Sokak No:33',
      latitude: 41.0316,
      longitude: 28.9836,
      ownerName: 'Pınar Doğan',
      ownerPhone: '05091239988',
      roomCount: '1+1',
      grossM2: 60,
      netM2: 52,
      buildingAge: 30,
      floor: 2,
      totalFloors: 4,
      heatingType: 'Doğalgaz (Kombi)',
      monthlyFee: 250,
      isFurnished: true,
    },
  ];
}

async function seedProperties(
  properties: SeedProperty[],
  organizationId: string,
  createdById: string,
) {
  for (const p of properties) {
    await prisma.property.upsert({
      where: { id: p.id },
      update: {},
      create: {
        id: p.id,
        organizationId,
        createdById,
        title: p.title,
        propertyType: p.propertyType,
        listingType: p.listingType,
        status: p.status,
        price: p.price,
        city: p.city,
        district: p.district,
        neighborhood: p.neighborhood,
        addressText: p.addressText,
        latitude: p.latitude,
        longitude: p.longitude,
        ownerName: p.ownerName,
        ownerPhone: p.ownerPhone,
        roomCount: p.roomCount,
        grossM2: p.grossM2,
        netM2: p.netM2,
        buildingAge: p.buildingAge,
        floor: p.floor,
        totalFloors: p.totalFloors,
        heatingType: p.heatingType,
        monthlyFee: p.monthlyFee,
        isFurnished: p.isFurnished,
        zoningStatus: p.zoningStatus,
        blockNo: p.blockNo,
        parcelNo: p.parcelNo,
      },
    });
  }
}

async function main() {
  const passwordHash = await bcrypt.hash(DEV_PASSWORD, 10);

  const superAdmin = await prisma.user.upsert({
    where: { email: 'superadmin@emlakpanel.dev' },
    update: {},
    create: {
      email: 'superadmin@emlakpanel.dev',
      passwordHash,
      fullName: 'Süper Admin',
      role: Role.SUPER_ADMIN,
      organizationId: null,
    },
  });

  const konyaOrg = await prisma.organization.upsert({
    where: { id: 'konya-emlak-org' },
    update: {},
    create: {
      id: 'konya-emlak-org',
      name: 'Konya Emlak Ofisi',
    },
  });

  const istanbulOrg = await prisma.organization.upsert({
    where: { id: 'istanbul-emlak-org' },
    update: {},
    create: {
      id: 'istanbul-emlak-org',
      name: 'İstanbul Emlak Ofisi',
    },
  });

  const konyaAdmin = await prisma.user.upsert({
    where: { email: 'admin@konyaemlak.dev' },
    update: {},
    create: {
      email: 'admin@konyaemlak.dev',
      passwordHash,
      fullName: 'Konya Org Admin',
      role: Role.ORG_ADMIN,
      organizationId: konyaOrg.id,
    },
  });

  const konyaAgent = await prisma.user.upsert({
    where: { email: 'agent@konyaemlak.dev' },
    update: {},
    create: {
      email: 'agent@konyaemlak.dev',
      passwordHash,
      fullName: 'Konya Emlak Danışmanı',
      role: Role.AGENT,
      organizationId: konyaOrg.id,
    },
  });

  const istanbulAdmin = await prisma.user.upsert({
    where: { email: 'admin@istanbulemlak.dev' },
    update: {},
    create: {
      email: 'admin@istanbulemlak.dev',
      passwordHash,
      fullName: 'İstanbul Org Admin',
      role: Role.ORG_ADMIN,
      organizationId: istanbulOrg.id,
    },
  });

  const istanbulAgent = await prisma.user.upsert({
    where: { email: 'agent@istanbulemlak.dev' },
    update: {},
    create: {
      email: 'agent@istanbulemlak.dev',
      passwordHash,
      fullName: 'İstanbul Emlak Danışmanı',
      role: Role.AGENT,
      organizationId: istanbulOrg.id,
    },
  });

  await seedProperties(konyaProperties(konyaOrg.id), konyaOrg.id, konyaAgent.id);
  await seedProperties(istanbulProperties(istanbulOrg.id), istanbulOrg.id, istanbulAgent.id);

  console.table(
    [
      { email: superAdmin.email, role: superAdmin.role, org: '-' },
      { email: konyaAdmin.email, role: konyaAdmin.role, org: konyaOrg.name },
      { email: konyaAgent.email, role: konyaAgent.role, org: konyaOrg.name },
      {
        email: istanbulAdmin.email,
        role: istanbulAdmin.role,
        org: istanbulOrg.name,
      },
      {
        email: istanbulAgent.email,
        role: istanbulAgent.role,
        org: istanbulOrg.name,
      },
    ].map((row) => ({ ...row, password: DEV_PASSWORD })),
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
