import { Router, type IRouter } from "express";
import bcrypt from "bcryptjs";
import { db } from "@workspace/db";
import { employeesTable } from "@workspace/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { requireAuth, signToken } from "../../middleware/auth";

const router: IRouter = Router();

router.post("/auth/login", async (req, res): Promise<void> => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: "Email and password are required" });
    return;
  }

  const [employee] = await db
    .select()
    .from(employeesTable)
    .where(and(eq(employeesTable.email, email), isNull(employeesTable.deletedAt)));

  if (!employee || !employee.isActive) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  const valid = await bcrypt.compare(password, employee.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  const token = signToken({
    employeeId: employee.id,
    email: employee.email,
    role: employee.role,
  });

  res.json({
    token,
    employee: {
      id: employee.id,
      name: employee.name,
      email: employee.email,
      role: employee.role,
      companyId: employee.companyId,
      isActive: employee.isActive,
      createdAt: employee.createdAt,
    },
  });
});

router.get("/auth/me", requireAuth, async (req, res): Promise<void> => {
  const [employee] = await db
    .select()
    .from(employeesTable)
    .where(eq(employeesTable.id, req.employee!.employeeId));

  if (!employee) {
    res.status(404).json({ error: "Employee not found" });
    return;
  }

  res.json({
    id: employee.id,
    name: employee.name,
    email: employee.email,
    role: employee.role,
    companyId: employee.companyId,
    isActive: employee.isActive,
    createdAt: employee.createdAt,
  });
});

router.post("/auth/logout", requireAuth, async (_req, res): Promise<void> => {
  // JWT is stateless — client just discards the token
  res.sendStatus(204);
});

export default router;
