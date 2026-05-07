import Link from "next/link";
import styles from "./page.module.css";

const PROFESSORS = [
  "Dra. Claudia Screpnik",
  "Ing. Jorge Vera",
];

const MEMBERS = [
  { name: "Duarte, Tomás",         legajo: "27913" },
  { name: "Pavicich, Drazen",       legajo: "28471" },
  { name: "Kozak Riehme, Paula",    legajo: "28646" },
  { name: "Lima, Matias Ezequiel",  legajo: "28765" },
  { name: "Orban, Gonzalo Tomás",   legajo: "28427" },
  { name: "Zapata, Jerónimo",       legajo: "28386" },
];

export default function Home() {
  return (
    <main className={styles.page}>
      <div className={styles.card}>

        {/* ── Header band ── */}
        <div className={styles.headerBand}>
          <span className={styles.university}>Universidad Tecnológica Nacional · FRRe</span>
          <span className={styles.faculty}>Ingeniería en Sistemas de Información</span>
          <h1 className={styles.subject}>Investigación Operativa</h1>
          <span className={styles.career}>Asistente inteligente de modelos de inventario probabilístico</span>
        </div>

        {/* ── Body ── */}
        <div className={styles.body}>

          {/* Group */}
          <div className={styles.groupTag}>
            <span className={styles.groupName}>Big Brain</span>
            <span className={styles.groupNumber}>Grupo 10</span>
          </div>

          {/* Professors */}
          <div className={styles.section}>
            <span className={styles.sectionLabel}>Profesores</span>
            <div className={styles.peopleList}>
              {PROFESSORS.map((p) => (
                <div key={p} className={styles.person}>
                  <span className={styles.personDot} />
                  {p}
                </div>
              ))}
            </div>
          </div>

          <hr className={styles.divider} />

          {/* Members */}
          <div className={styles.section}>
            <span className={styles.sectionLabel}>Integrantes</span>
            <div className={styles.peopleList}>
              {MEMBERS.map((m) => (
                <div key={m.legajo} className={styles.person}>
                  <span className={styles.personDot} />
                  {m.name}
                  <span className={styles.personLegajo}>{m.legajo}</span>
                </div>
              ))}
            </div>
          </div>

          <hr className={styles.divider} />

          {/* Footer */}
          <div className={styles.footer}>
            <span className={styles.year}>Ciclo lectivo 2026</span>
            <Link href="/chat" className={styles.ctaButton}>
              Abrir asistente
              <span className={styles.ctaArrow}>→</span>
            </Link>
          </div>

        </div>
      </div>
    </main>
  );
}
