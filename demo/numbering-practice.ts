// import { File, Paragraph, Numbering, INumberingOptions, LevelFormat, AlignmentType } from "docx";

// const numberingConfig: INumberingOptions = {
//     config: [
//         {
//             reference: "simple-bullet-list",
//             levels: [
//                 {
//                     level: 0,
//                     format: LevelFormat.BULLET,
//                     text: "•",
//                     alignment: AlignmentType.LEFT,
//                     style: {
//                         paragraph: {
//                             indent: { left: 720, hanging: 360 },
//                         },
//                     },
//                 },
//                 {
//                     level: 1,
//                     format: LevelFormat.BULLET,
//                     text: "◦",
//                     alignment: AlignmentType.LEFT,
//                     style: {
//                         paragraph: {
//                             indent: { left: 1440, hanging: 360 },
//                         },
//                     },
//                 },
//             ],
//         },
//         {
//             reference: "simple-ordered-list",
//             levels: [
//                 {
//                     level: 0,
//                     format: LevelFormat.DECIMAL,
//                     text: "%1.",
//                     alignment: AlignmentType.LEFT,
//                     style: {
//                         paragraph: {
//                             indent: { left: 720, hanging: 360 },
//                         },
//                     },
//                 },
//             ],
//         },
//     ],
// };

// // 1. Crea el archivo con la configuración
// const file = new File({
//     numbering: numberingConfig,
//     sections: [
//         {
//             children: [
//                 // Párrafos con lista de viñetas
//                 new Paragraph({
//                     text: "Elemento de viñeta 1",
//                     numbering: {
//                         reference: "simple-bullet-list",
//                         level: 0,
//                         instance: 0,
//                     },
//                 }),
//                 new Paragraph({
//                     text: "Elemento de viñeta 2",
//                     numbering: {
//                         reference: "simple-bullet-list",
//                         level: 0,
//                         instance: 0,
//                     },
//                 }),
//                 // Párrafos con lista ordenada
//                 new Paragraph({
//                     text: "Elemento ordenado 1",
//                     numbering: {
//                         reference: "simple-ordered-list",
//                         level: 0,
//                         instance: 0,
//                     },
//                 }),
//                 new Paragraph({
//                     text: "Elemento ordenado 2",
//                     numbering: {
//                         reference: "simple-ordered-list",
//                         level: 0,
//                         instance: 0,
//                     },
//                 }),
//             ],
//         },
//     ],
// });

// // 2. Crea instancias concretas de numeración
// file.Numbering.createConcreteNumberingInstance("simple-bullet-list", 0);
// file.Numbering.createConcreteNumberingInstance("simple-ordered-list", 0);

// console.log("ConcreteNumbering:", file.Numbering.ConcreteNumbering);