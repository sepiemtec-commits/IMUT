import { describe, expect, it, vi, beforeEach } from "vitest";

// ── Mocks antes de qualquer import do módulo ──────────────────────────
vi.mock("../lib/prisma.js", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    company: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    subscription: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    refreshToken: {
      findFirst: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
    },
    responsible: { count: vi.fn() },
    $transaction: vi.fn(),
  },
}));

vi.mock("../lib/jwt.js", () => ({
  buildTokenPair: vi.fn().mockReturnValue({
    accessToken: "access-token",
    refreshToken: "refresh-token",
  }),
  verifyRefreshToken: vi.fn(),
}));

vi.mock("../lib/auth-context.js", () => ({
  resolveAuthContext: vi.fn(),
}));

vi.mock("./audit.service.js", () => ({
  recordAudit: vi.fn().mockResolvedValue(undefined),
}));

// ── Imports após mocks ────────────────────────────────────────────────
import { prisma } from "../lib/prisma.js";
import { resolveAuthContext } from "../lib/auth-context.js";
import { loginUser, logoutUser, getMe } from "./auth.service.js";

const mockPrisma = prisma as unknown as Record<string, Record<string, ReturnType<typeof vi.fn>>>;

beforeEach(() => {
  vi.clearAllMocks();
});

// ─────────────────────────────────────────────
// loginUser
// ─────────────────────────────────────────────
describe("loginUser", () => {
  it("lança erro quando usuário não existe", async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);

    await expect(
      loginUser({ email: "inexistente@test.com", password: "senha123" }),
    ).rejects.toMatchObject({ code: "INVALID_CREDENTIALS" });
  });

  it("lança erro quando usuário está inativo", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      id: "u1",
      isActive: false,
      passwordHash: "$2b$12$fake",
    });

    await expect(
      loginUser({ email: "inativo@test.com", password: "senha123" }),
    ).rejects.toMatchObject({ code: "INVALID_CREDENTIALS" });
  });

  it("lança erro quando usuário não tem empresa", async () => {
    const bcrypt = await import("bcrypt");
    const hash = await bcrypt.hash("senha123", 1);

    mockPrisma.user.findUnique.mockResolvedValue({
      id: "u1",
      isActive: true,
      passwordHash: hash,
      name: "Teste",
    });

    (resolveAuthContext as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    await expect(
      loginUser({ email: "semempresa@test.com", password: "senha123" }),
    ).rejects.toMatchObject({ code: "NO_COMPANY" });
  });

  it("retorna tokens e dados ao fazer login com sucesso", async () => {
    const bcrypt = await import("bcrypt");
    const hash = await bcrypt.hash("senha123", 1);

    mockPrisma.user.findUnique.mockResolvedValue({
      id: "u1",
      isActive: true,
      passwordHash: hash,
      name: "Maria",
    });

    (resolveAuthContext as ReturnType<typeof vi.fn>).mockResolvedValue({
      userId: "u1",
      companyId: "c1",
      role: "OWNER",
      email: "maria@test.com",
    });

    mockPrisma.refreshToken.create.mockResolvedValue({});
    mockPrisma.subscription.findUnique.mockResolvedValue({
      status: "ACTIVE",
      currentPeriodEnd: new Date("2026-12-31"),
    });
    mockPrisma.company.findUnique.mockResolvedValue({
      id: "c1",
      name: "Empresa Teste",
    });

    const result = await loginUser({ email: "maria@test.com", password: "senha123" });

    expect(result.accessToken).toBe("access-token");
    expect(result.user.name).toBe("Maria");
    expect(result.user.role).toBe("OWNER");
    expect(result.subscription?.status).toBe("ACTIVE");
  });
});

// ─────────────────────────────────────────────
// logoutUser
// ─────────────────────────────────────────────
describe("logoutUser", () => {
  it("revoga apenas o refresh token fornecido", async () => {
    mockPrisma.refreshToken.deleteMany.mockResolvedValue({ count: 1 });

    await logoutUser("u1", "some-refresh-token");

    expect(mockPrisma.refreshToken.deleteMany).toHaveBeenCalledOnce();
    const call = mockPrisma.refreshToken.deleteMany.mock.calls[0][0] as { where: { tokenHash?: string } };
    expect(call.where).toHaveProperty("tokenHash");
  });

  it("revoga todos os tokens quando nenhum refresh é fornecido", async () => {
    mockPrisma.refreshToken.deleteMany.mockResolvedValue({ count: 5 });

    await logoutUser("u1");

    const call = mockPrisma.refreshToken.deleteMany.mock.calls[0][0] as { where: { userId: string } };
    expect(call.where).toEqual({ userId: "u1" });
  });
});

// ─────────────────────────────────────────────
// getMe
// ─────────────────────────────────────────────
describe("getMe", () => {
  it("retorna null quando contexto não é encontrado", async () => {
    (resolveAuthContext as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    const result = await getMe("u-invalido");
    expect(result).toBeNull();
  });

  it("retorna dados completos do usuário", async () => {
    (resolveAuthContext as ReturnType<typeof vi.fn>).mockResolvedValue({
      userId: "u1",
      companyId: "c1",
      role: "ADMIN",
    });

    mockPrisma.user.findUnique.mockResolvedValue({
      id: "u1",
      email: "admin@test.com",
      name: "Admin",
      phone: null,
    });

    mockPrisma.company.findUnique.mockResolvedValue({
      id: "c1",
      name: "Empresa",
      slug: "empresa-abc123",
    });

    mockPrisma.subscription.findUnique.mockResolvedValue({
      status: "ACTIVE",
      currentPeriodEnd: new Date("2026-12-31"),
    });

    mockPrisma.responsible.count.mockResolvedValue(2);

    const result = await getMe("u1");

    expect(result).not.toBeNull();
    expect(result!.user?.email).toBe("admin@test.com");
    expect(result!.role).toBe("ADMIN");
    expect(result!.limits.responsiblesUsed).toBe(2);
  });
});
