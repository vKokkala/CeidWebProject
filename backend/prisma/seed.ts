import { faker } from "@faker-js/faker";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, Role } from "../src/generated/prisma/client.js";
import dotenv from "dotenv";

dotenv.config();

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const getStudentFields = (role: Role) => {
  if (role !== Role.STUDENT) return {};

  return {
    student: {
      create: {
        am: faker.string.numeric(7),
        address: faker.location.streetAddress(),
        cellPhoneNumber: faker.phone.number(),
        phoneNumber: faker.phone.number(),
      },
    },
  };
};

const getProfessorFields = (role: Role) => {
  if (role !== Role.PROFESSOR) return {};

  return {
    professor: {
      create: {
        // TODO
      },
    },
  };
};

const populateUsers = async ({
  count,
  role,
}: {
  count: number;
  role: Role;
}) => {
  const users = Array.from({ length: count }, () =>
    prisma.user.create({
      data: {
        email: faker.internet.email(),
        role,
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        ...getStudentFields(role),
        ...getProfessorFields(role),
      },
    }),
  );

  await Promise.all(users);
};

export const populateDbWithRandomUsers = async () => {
  try {
    await Promise.all([
      populateUsers({ count: 10, role: Role.STUDENT }),
      populateUsers({ count: 5, role: Role.PROFESSOR }),
    ]);
  } catch (error) {
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
};
