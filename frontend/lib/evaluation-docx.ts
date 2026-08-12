import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  ShadingType,
  AlignmentType,
  VerticalAlign,
  HeightRule,
  ImageRun,
  Header,
  Footer,
  VerticalMergeType,
  TableLayoutType,
} from 'docx'
import type { OperateurEconomique, Evaluation, Prestation } from './types'

// ---------- constantes ----------
const PAGE_W = 11906
const PAGE_H = 16838
const MARGIN = { top: 1957, bottom: 1417, left: 1134, right: 1133, header: 993, footer: 708 }
const USABLE_W = PAGE_W - MARGIN.left - MARGIN.right
const GREEN = 'E2EFD9'
const GREY = 'F2F2F2'
const BLACK = '000000'
const FONT = 'Trebuchet MS'

const CHECKED = '☑'
const UNCHECKED = '▢'

const thin = { style: BorderStyle.SINGLE, size: 4, color: BLACK }
const cellBorders = { top: thin, bottom: thin, left: thin, right: thin }
const noBorders = {
  top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
}

export interface EvaluationDocxData {
  operateur: OperateurEconomique
  evaluation: Evaluation
  prestation?: Prestation | null
}

const APPRECIATIONS: { min: number; range: string; label: string }[] = [
  { min: 20, range: '(20)', label: 'EXCELLENT' },
  { min: 16, range: '(19-16)', label: 'BON' },
  { min: 12, range: '(15-12)', label: 'SATISFAISANT' },
  { min: 8, range: '(11-08)', label: 'INSATISFAISANT' },
  { min: 0, range: '(7-0)', label: 'MAUVAIS' },
]

function getAppreciation(note: number) {
  return APPRECIATIONS.find((s) => note >= s.min) ?? APPRECIATIONS[APPRECIATIONS.length - 1]
}

function fmtDate(dateString?: string) {
  if (!dateString) return ''
  const d = new Date(dateString)
  if (isNaN(d.getTime())) return dateString
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const yyyy = d.getFullYear()
  return `${dd}.${mm}.${yyyy}`
}

function txt(text: string, opts: Record<string, unknown> = {}) {
  return new TextRun({ text, font: FONT, size: (opts.size as number) || 18, bold: !!opts.bold, italics: !!opts.italics, ...opts })
}

function para(
  children: TextRun | ImageRun | (TextRun | ImageRun)[],
  opts: { alignment?: (typeof AlignmentType)[keyof typeof AlignmentType]; spacing?: { before: number; after: number } } = {}
) {
  return new Paragraph({
    children: Array.isArray(children) ? children : [children],
    alignment: opts.alignment || AlignmentType.LEFT,
    spacing: opts.spacing || { before: 10, after: 10 },
  })
}

type CellBorders = {
  top: { style: (typeof BorderStyle)[keyof typeof BorderStyle]; size: number; color: string }
  bottom: { style: (typeof BorderStyle)[keyof typeof BorderStyle]; size: number; color: string }
  left: { style: (typeof BorderStyle)[keyof typeof BorderStyle]; size: number; color: string }
  right: { style: (typeof BorderStyle)[keyof typeof BorderStyle]; size: number; color: string }
}

function cell(
  children: Paragraph | Paragraph[],
  opts: {
    width?: number
    fill?: string
    valign?: 'top' | 'center' | 'bottom'
    borders?: CellBorders
    colSpan?: number
    rowSpan?: number
  } = {}
) {
  return new TableCell({
    children: Array.isArray(children) ? children : [children],
    width: opts.width ? { size: opts.width, type: WidthType.DXA } : undefined,
    shading: opts.fill ? { type: ShadingType.CLEAR, color: 'auto', fill: opts.fill } : undefined,
    verticalAlign: opts.valign || VerticalAlign.CENTER,
    borders: opts.borders || cellBorders,
    columnSpan: opts.colSpan,
    rowSpan: opts.rowSpan,
    margins: { top: 20, bottom: 20, left: 80, right: 80 },
  })
}

function checkboxCell(width: number) {
  return cell(para(txt('', {}), { alignment: AlignmentType.CENTER }), { width, fill: 'FFFFFF' })
}

// ============================================================
// EN-TETE (répété en haut de chaque page) — logo / titre / meta
// ============================================================
function headerTable(logoData: string) {
  const c1w = 2400
  const c2w = 5200
  const c3w = 1050
  const c4w = 989
  const logoImg = new ImageRun({
    data: logoData,
    transformation: { width: 108, height: 64 },
    type: 'png',
  })

  const row1 = new TableRow({
    children: [
      new TableCell({
        children: [para(logoImg, { alignment: AlignmentType.CENTER })],
        width: { size: c1w, type: WidthType.DXA },
        verticalMerge: VerticalMergeType.RESTART,
        verticalAlign: VerticalAlign.CENTER,
        borders: cellBorders,
        margins: { top: 40, bottom: 40, left: 60, right: 60 },
      }),
      new TableCell({
        children: [
          para(txt("FICHE D'EVALUATION ET DE", { bold: true, size: 24 }), { alignment: AlignmentType.CENTER }),
          para(txt('REEVALUATION DES PERFORMANCES', { bold: true, size: 24 }), { alignment: AlignmentType.CENTER }),
          para(txt('DU PRESTATAIRE', { bold: true, size: 24 }), { alignment: AlignmentType.CENTER }),
        ],
        width: { size: c2w, type: WidthType.DXA },
        verticalMerge: VerticalMergeType.RESTART,
        verticalAlign: VerticalAlign.CENTER,
        borders: cellBorders,
      }),
      cell(para([txt('N° : ', { bold: true, size: 16 }), txt('ER.ALP.27.R', { bold: true, size: 16 }), txt('1', { bold: true, size: 12 })]), { width: c3w + c4w, colSpan: 2 }),
    ],
  })
  const row2 = new TableRow({
    children: [
      new TableCell({ children: [para(txt(''))], verticalMerge: VerticalMergeType.CONTINUE, borders: cellBorders }),
      new TableCell({ children: [para(txt(''))], verticalMerge: VerticalMergeType.CONTINUE, borders: cellBorders }),
      cell(para([txt('Lié à : ', { bold: true, size: 16 }), txt('GD.ALP.01.R', { bold: true, size: 16 }), txt('X', { bold: true, size: 12 })]), { width: c3w + c4w, colSpan: 2 }),
    ],
  })
  const row3 = new TableRow({
    children: [
      new TableCell({ children: [para(txt(''))], verticalMerge: VerticalMergeType.CONTINUE, borders: cellBorders }),
      new TableCell({ children: [para(txt(''))], verticalMerge: VerticalMergeType.CONTINUE, borders: cellBorders }),
      cell(para([txt('Date de création :', { bold: true, size: 14 }), new TextRun({ text: '', break: 1 }), txt('14.05.2023', { size: 14 })]), { width: c3w }),
      cell(para([txt('Date de Révision :', { bold: true, size: 14 }), new TextRun({ text: '', break: 1 }), txt('20.01.2026', { size: 14 })]), { width: c4w }),
    ],
  })
  const row4 = new TableRow({
    children: [
      new TableCell({ children: [para(txt(''))], verticalMerge: VerticalMergeType.CONTINUE, borders: cellBorders }),
      new TableCell({ children: [para(txt(''))], verticalMerge: VerticalMergeType.CONTINUE, borders: cellBorders }),
      cell(para([txt('Page :   ', { bold: true, size: 16 }), txt('1', { size: 16 }), txt('   sur  ', { size: 16 }), txt('2', { size: 16 })]), { width: c3w + c4w, colSpan: 2 }),
    ],
  })

  return new Table({
    rows: [row1, row2, row3, row4],
    width: { size: USABLE_W, type: WidthType.DXA },
    columnWidths: [c1w, c2w, c3w, c4w],
    layout: TableLayoutType.FIXED,
  })
}

function footerImageTable(footerData: string) {
  const img = new ImageRun({ data: footerData, transformation: { width: 200, height: 55 }, type: 'png' })
  return para(img, { alignment: AlignmentType.LEFT })
}

// ============================================================
// PAGE 1
// ============================================================
function contactInfoTable(data: EvaluationDocxData) {
  const w = USABLE_W
  const { operateur, evaluation, prestation } = data

  const dateLine = para(
    [
      txt('Date : ', { bold: true, size: 18 }),
      txt(fmtDate(evaluation.dateEvaluation) + '   ', { size: 18 }),
      txt('Evaluation', { bold: true, italics: true, size: 18 }),
      txt(`  ${CHECKED}   `, { size: 18 }),
      txt('ou Réévaluation', { bold: true, italics: true, size: 18 }),
      txt(`  ${UNCHECKED}   `, { size: 18 }),
      txt('N° : ', { bold: true, size: 18 }),
      txt(String(evaluation.id), { size: 18 }),
    ],
    { spacing: { before: 16, after: 16 } }
  )

  const rows = [
    new TableRow({ children: [cell(dateLine, { width: w, fill: GREEN, borders: noBorders })] }),
    new TableRow({
      children: [
        cell(
          para([
            txt('Prestataire : ', { bold: true, size: 18 }),
            txt(operateur.raisonSociale || '', { size: 18 }),
            txt('    Acheteur : ', { bold: true, size: 18 }),
            txt(prestation?.structureContractante || '', { size: 18 }),
          ]),
          { width: w, fill: GREEN, borders: noBorders }
        ),
      ],
    }),
    new TableRow({
      children: [
        cell(
          para([
            txt('Adresse : ', { bold: true, size: 18 }),
            txt(operateur.adresse || '', { size: 18 }),
            txt('    Pays : ', { bold: true, size: 18 }),
            txt(operateur.wilaya || '', { size: 18 }),
          ]),
          { width: w, fill: GREEN, borders: noBorders }
        ),
      ],
    }),
    new TableRow({
      children: [
        cell(
          para([
            txt('Tél. : ', { bold: true, size: 18 }),
            txt(operateur.telephone || '', { size: 18 }),
            txt('    E-mail : ', { bold: true, size: 18 }),
            txt(operateur.email || '', { size: 18 }),
          ]),
          { width: w, fill: GREEN, borders: noBorders }
        ),
      ],
    }),
    new TableRow({
      children: [
        cell(
          para([
            txt('Contrat/BC N° : ', { bold: true, size: 18 }),
            txt(prestation?.reference || '', { size: 18 }),
            txt('    Objet : ', { bold: true, size: 18 }),
            txt(prestation?.description || prestation?.structureContractante || '', { size: 18 }),
          ]),
          { width: w, fill: GREEN, borders: noBorders }
        ),
      ],
    }),
    new TableRow({
      children: [
        cell(
          para([
            txt('Date de notification : ', { bold: true, size: 18 }),
            txt('        ', { size: 18 }),
            txt('Délai de Livraison : ', { bold: true, size: 18 }),
            txt('        ', { size: 18 }),
            txt('Durée du contrat : ', { bold: true, size: 18 }),
            txt(prestation?.dateDebut ? `${fmtDate(prestation.dateDebut)} → ${fmtDate(prestation.dateFin)}` : '', { size: 18 }),
          ]),
          { width: w, fill: GREEN, borders: noBorders }
        ),
      ],
    }),
    new TableRow({
      children: [
        cell(
          para([
            txt('Habituel : ', { bold: true, size: 18 }),
            txt(` ${UNCHECKED}    `, { size: 18 }),
            txt('Nouveau : ', { bold: true, size: 18 }),
            txt(` ${UNCHECKED}    `, { size: 18 }),
            txt('Potentiel : ', { bold: true, size: 18 }),
            txt(` ${UNCHECKED}`, { size: 18 }),
          ]),
          { width: w, fill: GREEN, borders: noBorders }
        ),
      ],
    }),
  ]

  return new Table({ rows, width: { size: w, type: WidthType.DXA }, columnWidths: [w] })
}

function aptitudesTable() {
  const c1 = 3400
  const c2 = 2400
  const cb = 500
  const c3 = 1650
  const cb2 = 500
  const c4 = 1189
  const totalRight = c2 + cb + c3 + cb2 + c4

  const row1 = new TableRow({
    children: [
      new TableCell({
        children: [para(txt('APTITUDES PROFESSIONNELLES', { bold: true, italics: true, size: 20 }), { alignment: AlignmentType.CENTER })],
        width: { size: c1, type: WidthType.DXA },
        verticalMerge: VerticalMergeType.RESTART,
        verticalAlign: VerticalAlign.CENTER,
        borders: cellBorders,
      }),
      cell(para(txt('CERTIFICATION « ISO » :', { bold: true, italics: true, size: 18 }), { alignment: AlignmentType.CENTER }), { width: totalRight, colSpan: 5, fill: GREY }),
    ],
  })
  const row2 = new TableRow({
    children: [
      new TableCell({ children: [para(txt(''))], verticalMerge: VerticalMergeType.CONTINUE, borders: cellBorders }),
      cell(para(txt('Oui', { bold: true, italics: true, size: 18 }), { alignment: AlignmentType.CENTER }), { width: c2, fill: GREY }),
      checkboxCell(cb),
      cell(para(txt('Non', { bold: true, italics: true, size: 18 }), { alignment: AlignmentType.CENTER }), { width: c3, fill: GREY }),
      checkboxCell(cb2),
      cell(para(txt('')), { width: c4, fill: GREY }),
    ],
  })
  const row3 = new TableRow({
    children: [
      new TableCell({ children: [para(txt(''))], verticalMerge: VerticalMergeType.CONTINUE, borders: cellBorders }),
      cell(para(txt('EXPERIENCE PROFESSIONNELLE', { bold: true, italics: true, size: 18 }), { alignment: AlignmentType.CENTER }), { width: totalRight, colSpan: 5, fill: GREY }),
    ],
  })
  const row4 = new TableRow({
    children: [
      new TableCell({ children: [para(txt(''))], verticalMerge: VerticalMergeType.CONTINUE, borders: cellBorders }),
      cell(para(txt('< 5 ans', { bold: true, italics: true, size: 18 }), { alignment: AlignmentType.CENTER }), { width: c2, fill: GREY }),
      checkboxCell(cb),
      cell(para(txt('= 5 ans', { bold: true, italics: true, size: 18 }), { alignment: AlignmentType.CENTER }), { width: c3, fill: GREY }),
      checkboxCell(cb2),
      cell(para(txt('> 5ans', { bold: true, italics: true, size: 18 }), { alignment: AlignmentType.CENTER }), { width: c4, fill: GREY }),
    ],
  })

  return new Table({
    rows: [row1, row2, row3, row4],
    width: { size: USABLE_W, type: WidthType.DXA },
    columnWidths: [c1, c2, cb, c3, cb2, c4],
  })
}

function evaluationTable(data: EvaluationDocxData) {
  const c1 = 3400
  const c2 = 1650
  const c3 = 1650
  const c4 = 1450
  const c5 = 1489
  const { evaluation } = data
  const noteLine = (label: string) =>
    cell(para(txt(label, { bold: true, size: 18 }), { alignment: AlignmentType.CENTER }), { width: c4 })

  const headerRow = new TableRow({
    children: [
      cell(para(txt("CRITERES D'EVALUATION", { bold: true, size: 18 }), { alignment: AlignmentType.CENTER }), { width: c1, fill: GREY }),
      cell(para(txt('BAREME DE NOTATION', { bold: true, size: 18 }), { alignment: AlignmentType.CENTER }), { width: c2 + c3, colSpan: 2, fill: GREY }),
      cell(para(txt("NOTE D'EVALUATION", { bold: true, size: 18 }), { alignment: AlignmentType.CENTER }), { width: c4, fill: GREY }),
      cell(para(txt('OBS', { bold: true, size: 18 }), { alignment: AlignmentType.CENTER }), { width: c5, fill: GREY }),
    ],
  })

  const obs = new TableCell({
    children: [para(txt("Voir grille d'évaluation en annexe", { bold: true, italics: true, size: 18 }), { alignment: AlignmentType.CENTER })],
    width: { size: c5, type: WidthType.DXA },
    verticalMerge: VerticalMergeType.RESTART,
    verticalAlign: VerticalAlign.CENTER,
    borders: cellBorders,
  })
  const obsCont = () => new TableCell({ children: [para(txt(''))], verticalMerge: VerticalMergeType.CONTINUE, borders: cellBorders })

  const critLabel = (text: string, sub?: string) =>
    cell(
      para([
        txt(text, { bold: true, size: 18 }),
        ...(sub ? [new TextRun({ text: '', break: 1 }), txt(sub, { italics: true, size: 18 })] : []),
      ], { alignment: AlignmentType.CENTER }),
      { width: c1 }
    )

  const bareme = (b: string) => cell(para(txt(b, { italics: true, size: 18 }), { alignment: AlignmentType.CENTER }), { width: c2 })
  const pct = (p: string) => cell(para(txt(p, { italics: true, size: 18 }), { alignment: AlignmentType.CENTER }), { width: c3 })

  const r1 = new TableRow({
    children: [
      critLabel('Conformité du Produit/Service Acheté', '(Respect des spécifications techniques)'),
      bareme('/ 5'),
      pct('25%'),
      noteLine(String(evaluation.noteConformite)),
      obs,
    ],
  })
  const r2 = new TableRow({
    children: [critLabel('Délai de livraison'), bareme('/ 5'), pct('25%'), noteLine(String(evaluation.noteDelai)), obsCont()],
  })
  const r3 = new TableRow({
    children: [critLabel('Prix'), bareme('/ 4'), pct('20%'), noteLine(String(Math.max(evaluation.notePrixConsultation, evaluation.notePrixContrat))), obsCont()],
  })
  const r4 = new TableRow({
    children: [critLabel('Respect des spécifications HSE'), bareme('/2'), pct('10%'), noteLine(String(evaluation.noteHse)), obsCont()],
  })
  const r5 = new TableRow({
    children: [
      critLabel(
        'Le Service et la Relation Client',
        '(Réactivité, Proactivité, Flexibilité, qualité de la Communication, clarté et pertinence des échanges, SAV, traitement et prise en charge des réclamations…etc.)'
      ),
      bareme('/ 4'),
      pct('20%'),
      noteLine(String(evaluation.noteService)),
      obsCont(),
    ],
  })
  const r6 = new TableRow({
    children: [critLabel('Note globale'), bareme('/ 20'), pct('100%'), noteLine(String(evaluation.noteGlobale)), obsCont()],
  })

  return new Table({
    rows: [headerRow, r1, r2, r3, r4, r5, r6],
    width: { size: USABLE_W, type: WidthType.DXA },
    columnWidths: [c1, c2, c3, c4, c5],
  })
}

function echelleTable(noteGlobale: number) {
  const w = Math.floor(USABLE_W / 5)
  const ws = [w, w, w, w, USABLE_W - w * 4]
  const appreciation = getAppreciation(noteGlobale)

  const headerRow = new TableRow({
    children: APPRECIATIONS.map((l, i) =>
      cell(para([txt(l.label, { bold: true, size: 18 }), new TextRun({ text: '', break: 1 }), txt(l.range, { bold: true, size: 18 })], { alignment: AlignmentType.CENTER }), {
        width: ws[i],
        fill: GREY,
      })
    ),
  })
  const markerRow = new TableRow({
    children: ws.map((wi, i) =>
      cell(para(txt(APPRECIATIONS[i].label === appreciation.label ? 'X' : '', { bold: true, size: 18 }), { alignment: AlignmentType.CENTER }), {
        width: wi,
        fill: GREY,
      })
    ),
  })
  return new Table({ rows: [headerRow, markerRow], width: { size: USABLE_W, type: WidthType.DXA }, columnWidths: ws })
}

function titleBar(text: string) {
  return new Table({
    rows: [new TableRow({ children: [cell(para(txt(text, { bold: true, size: 20 }), { alignment: AlignmentType.CENTER }), { width: USABLE_W })] })],
    width: { size: USABLE_W, type: WidthType.DXA },
    columnWidths: [USABLE_W],
  })
}

function decisionTable(noteGlobale: number, commentaire?: string) {
  const w = USABLE_W
  const appreciation = getAppreciation(noteGlobale)
  const rows = [
    new TableRow({ children: [cell(para(txt('DECISION PRISE', { bold: true, size: 20 }), { alignment: AlignmentType.CENTER }), { width: w })] }),
    new TableRow({
      height: { value: 800, rule: HeightRule.ATLEAST },
      children: [
        cell(
          [
            para(txt('')),
            para(txt(`Note globale : ${noteGlobale} / 20 — ${appreciation.label}`, { bold: true, size: 18 })),
            ...(commentaire ? [para(txt(`Commentaire : ${commentaire}`, { italics: true, size: 18 }))] : []),
            para(txt('')),
            para([txt('NB :', { bold: true, italics: true, size: 18 }), txt('La note globale relative à la décision de maintien des prestataires ne saurait être inférieure à 12 Points.', { italics: true, size: 18, highlight: 'yellow' })]),
          ],
          { width: w, valign: VerticalAlign.BOTTOM }
        ),
      ],
    }),
  ]
  return new Table({ rows, width: { size: w, type: WidthType.DXA }, columnWidths: [w] })
}

function signatureTable(data: EvaluationDocxData) {
  const c1 = 2400
  const c2 = 2413
  const c3 = 2413
  const c4 = 2413
  const { evaluation } = data
  const head = new TableRow({
    cantSplit: true,
    children: [
      cell(para(txt('')), { width: c1, fill: GREY }),
      cell(para(txt('Evaluateur', { bold: true, size: 18 }), { alignment: AlignmentType.CENTER }), { width: c2, fill: GREY }),
      cell(para(txt('Sous-Direction', { bold: true, size: 18 }), { alignment: AlignmentType.CENTER }), { width: c3, fill: GREY }),
      cell(para(txt('Directeur', { bold: true, size: 18 }), { alignment: AlignmentType.CENTER }), { width: c4, fill: GREY }),
    ],
  })
  const mkRow = (label: string, value?: string) =>
    new TableRow({
      cantSplit: true,
      height: { value: 320, rule: HeightRule.ATLEAST },
      children: [
        cell(para(txt(label, { bold: true, size: 18 }), { alignment: AlignmentType.CENTER }), { width: c1 }),
        cell(para(txt(value || '', { size: 18 }), { alignment: AlignmentType.CENTER }), { width: c2 }),
        cell(para(txt(''), { alignment: AlignmentType.CENTER }), { width: c3 }),
        cell(para(txt(''), { alignment: AlignmentType.CENTER }), { width: c4 }),
      ],
    })
  return new Table({
    rows: [
      head,
      mkRow('Nom & Prénoms', evaluation.evaluateurNom || ''),
      mkRow('Date', fmtDate(evaluation.dateEvaluation)),
      mkRow('Signature'),
    ],
    width: { size: c1 + c2 + c3 + c4, type: WidthType.DXA },
    columnWidths: [c1, c2, c3, c4],
  })
}

// ============================================================
// PAGE 2 — grille détaillée
// ============================================================
function grilleTable(data: EvaluationDocxData) {
  const c1 = 3000
  const c2 = 900
  const c3 = 5739
  const { evaluation } = data

  const priceIsContrat = evaluation.notePrixContrat > evaluation.notePrixConsultation
  const priceNote = Math.max(evaluation.notePrixConsultation, evaluation.notePrixContrat)

  const headerRow = new TableRow({
    children: [
      cell(para(txt('Critère', { bold: true, size: 18 }), { alignment: AlignmentType.CENTER }), { width: c1, fill: GREY }),
      cell(para(txt('Note', { bold: true, size: 18 }), { alignment: AlignmentType.CENTER }), { width: c2, fill: GREY }),
      cell(para(txt('Appréciation', { bold: true, size: 18 }), { alignment: AlignmentType.CENTER }), { width: c3, fill: GREY }),
    ],
  })

  const groups: {
    label: [string, boolean, boolean][]
    fill: string | null
    selected: number
    items: [string, string][]
  }[] = [
    {
      label: [['Conformité du Produit/Service Acheté', true, false], ['(Respect des spécifications techniques)', false, true]],
      fill: GREEN,
      selected: evaluation.noteConformite,
      items: [
        ['0', 'Non-respect des exigences techniques ayant une incidence sur la qualité du produit et service'],
        ['2', "Qualité acceptable ou non-respect partiel des Exigences Techniques, n'ayant pas une incidence sur la qualité du produit et service"],
        ['4', 'Bonne qualité (conforme aux exigences)'],
        ['5', 'Très bonne qualité (au-delà des exigences et attentes)'],
      ],
    },
    {
      label: [['Délai de livraison', true, false]],
      fill: null,
      selected: evaluation.noteDelai,
      items: [
        ['0', 'Non-respect des délais'],
        ['2', "Acceptable - non-respect des délais n'ayant pas une incidence sur les délais de réalisation."],
        ['4', 'Respect des délais'],
        ['5', 'Effort exceptionnel (délais réduits)'],
      ],
    },
    priceIsContrat
      ? {
          label: [['Prix (Contrat à commande)', true, false]],
          fill: GREEN,
          selected: priceNote,
          items: [
            ['0', 'Prix réviser à la hausse'],
            ['3', 'Prix maintenu'],
            ['4', 'Effort commercial/Remise'],
          ],
        }
      : {
          label: [['Prix (Consultation)', true, false]],
          fill: GREEN,
          selected: priceNote,
          items: [
            ['0', 'Prix Excessif'],
            ['2', 'Prix Moyen'],
            ['4', 'Prix moins disant'],
          ],
        },
    {
      label: [['Respect des spécifications HSE', true, false]],
      fill: GREEN,
      selected: evaluation.noteHse,
      items: [
        ['0', "Non-respect des spécifications impactant la santé sécurité et/ou l'environnement"],
        ['2', 'Respect des spécifications HSE'],
      ],
    },
    {
      label: [['Le Service et la Relation Client', true, false], ['(Réactivité, Proactivité, Flexibilité, qualité de la Communication, clarté et pertinence des échanges, SAV, traitement et prise en charge des réclamations…etc.)', false, true]],
      fill: null,
      selected: evaluation.noteService,
      items: [
        ['0', 'Qualité de service médiocre'],
        ['2', 'Qualité de service moyennement satisfaisante (nombre de requêtes ≥3)'],
        ['3', 'Qualité de service satisfaisante (nombre de requêtes ≤ 2)'],
        ['4', 'Qualité de service excellente (nombre de requêtes = 0)'],
      ],
    },
  ]

  const rows = [headerRow]
  for (const g of groups) {
    const n = g.items.length
    g.items.forEach((item, idx) => {
      const children: TableCell[] = []
      if (idx === 0) {
        const labelParas = g.label.map((l) => para(txt(l[0], { bold: l[1], italics: l[2], size: 17 }), { alignment: AlignmentType.CENTER }))
        children.push(
          new TableCell({
            children: labelParas,
            width: { size: c1, type: WidthType.DXA },
            rowSpan: n,
            verticalAlign: VerticalAlign.CENTER,
            borders: cellBorders,
            shading: g.fill ? { type: ShadingType.CLEAR, color: 'auto', fill: g.fill } : undefined,
            margins: { top: 40, bottom: 40, left: 80, right: 80 },
          })
        )
      }
      const isSelected = g.selected === Number(item[0])
      children.push(
        cell(para(txt(item[0], { size: 18, bold: isSelected }), { alignment: AlignmentType.CENTER }), {
          width: c2,
          fill: g.fill || undefined,
          borders: isSelected ? { top: { style: BorderStyle.SINGLE, size: 12, color: BLACK }, bottom: { style: BorderStyle.SINGLE, size: 12, color: BLACK }, left: thin, right: thin } : cellBorders,
        })
      )
      children.push(cell(para(txt(item[1], { size: 18 })), { width: c3, fill: g.fill || undefined }))
      rows.push(new TableRow({ children }))
    })
  }

  return new Table({
    rows,
    width: { size: c1 + c2 + c3, type: WidthType.DXA },
    columnWidths: [c1, c2, c3],
  })
}

async function loadImageAsDataURI(url: string): Promise<string> {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`Impossible de charger l'image ${url}`)
  const blob = await response.blob()
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error(`Impossible de lire l'image ${url}`))
    reader.readAsDataURL(blob)
  })
}

// ============================================================
// ASSEMBLAGE DU DOCUMENT
// ============================================================
export async function generateEvaluationDocx(data: EvaluationDocxData): Promise<Blob> {
  const [logoData, footerData] = await Promise.all([
    loadImageAsDataURI('/logo_slogan.png'),
    loadImageAsDataURI('/footer.png'),
  ])

  const headerObj = new Header({ children: [headerTable(logoData)] })
  const footerObj = new Footer({ children: [footerImageTable(footerData)] })

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            size: { width: PAGE_W, height: PAGE_H },
            margin: MARGIN,
            borders: {
              pageBorders: {
                display: 'allPages',
                offsetFrom: 'text',
              },
              pageBorderTop: { style: BorderStyle.SINGLE, size: 8, color: BLACK, space: 25 },
              pageBorderBottom: { style: BorderStyle.SINGLE, size: 8, color: BLACK, space: 10 },
              pageBorderLeft: { style: BorderStyle.SINGLE, size: 8, color: BLACK, space: 32 },
              pageBorderRight: { style: BorderStyle.SINGLE, size: 8, color: BLACK, space: 32 },
            },
          },
        },
        headers: { default: headerObj },
        footers: { default: footerObj },
        children: [
          contactInfoTable(data),
          new Paragraph({ spacing: { before: 6, after: 6 }, children: [] }),
          aptitudesTable(),
          new Paragraph({ spacing: { before: 6, after: 6 }, children: [] }),
          evaluationTable(data),
          new Paragraph({ spacing: { before: 6, after: 6 }, children: [] }),
          titleBar("ECHELLE D'APPRECIATION"),
          echelleTable(data.evaluation.noteGlobale),
          new Paragraph({ spacing: { before: 6, after: 6 }, children: [] }),
          decisionTable(data.evaluation.noteGlobale, data.evaluation.commentaire),
          new Paragraph({ spacing: { before: 6, after: 6 }, children: [] }),
          signatureTable(data),
          new Paragraph({ children: [], pageBreakBefore: true }),
          titleBar("GRILLE D'EVALUATION ET DE REEVALUATION DES PERFORMANCES DU PRESTATAIRE"),
          para(txt('')),
          grilleTable(data),
        ],
      },
    ],
  })

  return Packer.toBlob(doc)
}
