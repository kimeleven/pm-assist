import "dotenv/config";
import { prisma } from "../lib/db";
import bcrypt from "bcryptjs";

async function main() {
  console.log("🌱 시드 데이터 생성 시작...");

  // 기존 데이터 초기화
  await prisma.report.deleteMany();
  await prisma.device.deleteMany();
  await prisma.user.deleteMany();
  await prisma.company.deleteMany();

  // PM업체 3개 생성
  const [kickgoing, lime, deer] = await Promise.all([
    prisma.company.create({ data: { name: "킥고잉", contact: "070-1111-2222", address: "경북 구미시 신평동 1" } }),
    prisma.company.create({ data: { name: "라임", contact: "070-3333-4444", address: "경북 구미시 원평동 5" } }),
    prisma.company.create({ data: { name: "디어", contact: "070-5555-6666", address: "경북 구미시 도량동 12" } }),
  ]);

  // 이동장치 등록
  const devices = await Promise.all([
    prisma.device.create({ data: { qrCode: "KG-001", companyId: kickgoing.id, model: "킥고잉 X1" } }),
    prisma.device.create({ data: { qrCode: "KG-002", companyId: kickgoing.id, model: "킥고잉 X1" } }),
    prisma.device.create({ data: { qrCode: "LM-001", companyId: lime.id, model: "라임 S3" } }),
    prisma.device.create({ data: { qrCode: "LM-002", companyId: lime.id, model: "라임 S3" } }),
    prisma.device.create({ data: { qrCode: "DR-001", companyId: deer.id, model: "디어 D2" } }),
  ]);

  // 관리자(공무원) 계정
  const adminHash = await bcrypt.hash("admin1234!", 10);
  await prisma.user.create({
    data: { username: "admin", passwordHash: adminHash, role: "ADMIN" },
  });

  // PM업체 계정
  const companyHash = await bcrypt.hash("company1234!", 10);
  await Promise.all([
    prisma.user.create({ data: { username: "kickgoing", passwordHash: companyHash, role: "COMPANY", companyId: kickgoing.id } }),
    prisma.user.create({ data: { username: "lime", passwordHash: companyHash, role: "COMPANY", companyId: lime.id } }),
    prisma.user.create({ data: { username: "deer", passwordHash: companyHash, role: "COMPANY", companyId: deer.id } }),
  ]);

  // 구미시 중심부 좌표 기준 신고 20건
  const violations = ["차도 위 방치", "보도 위 방치", "횡단보도 위 방치", "점자블록 위 방치", "기타"];
  const companies = [kickgoing, lime, deer];
  const baseTime = new Date();

  const reports = Array.from({ length: 20 }, (_, i) => {
    const company = companies[i % 3];
    const device = devices[i % 5];
    const hoursAgo = Math.random() * 12;
    const reportedAt = new Date(baseTime.getTime() - hoursAgo * 3600000);
    const gracePeriodEnd = new Date(reportedAt.getTime() + 30 * 60 * 1000);
    const isOld = hoursAgo > 1;

    return {
      reporterPhone: `010-${String(1000 + i).padStart(4, "0")}-${String(5000 + i).padStart(4, "0")}`,
      companyId: company.id,
      deviceId: device.companyId === company.id ? device.id : null,
      violationType: violations[i % violations.length],
      locationLat: 36.1195 + (Math.random() - 0.5) * 0.04,
      locationLng: 128.3441 + (Math.random() - 0.5) * 0.04,
      photoUrl: "https://via.placeholder.com/400x300?text=PM+신고+사진",
      gracePeriodEnd,
      reportedAt,
      status: isOld && i < 5 ? ("FIXED" as const) : ("RECEIVED" as const),
      actionResult: isOld && i < 5 ? "FIXED" : null,
      actionAt: isOld && i < 5 ? new Date() : null,
    };
  });

  await Promise.all(reports.map((r) => prisma.report.create({ data: r })));

  console.log("✅ 시드 완료!");
  console.log("  관리자 계정: admin / admin1234!");
  console.log("  킥고잉 계정: kickgoing / company1234!");
  console.log("  라임 계정: lime / company1234!");
  console.log("  디어 계정: deer / company1234!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
