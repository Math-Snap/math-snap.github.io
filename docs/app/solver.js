/* Math Snap offline solver. Needs mathjs loaded as global `math`.
   Every step is a pair [claim, reason], like a "טענה / נימוק" table in class. */
(function (root) {
  "use strict";
  const M = () => root.math || globalThis.math;
  const SCOPE = { logb: (x, b) => Math.log(x) / Math.log(b) };

  // ---------- language ----------
  let LANG = "en";
  const iso = x => (LANG === "en" ? x : "⁦" + x + "⁩"); // keep math left-to-right inside Hebrew
  const MSG = {
    en: {
      divZero: "You can't divide by zero.",
      tooBig: "The answer is too big or undefined.",
      powNoReal: "That power has no real answer.",
      undefinedTrig: "That has no answer (it's undefined).",
      negSqrt: "A negative number has no real square root.",
      noNumber: "I couldn't read a number in this problem.",
      unknownSym: n => "I don't know what \"" + n + "\" means here.",
      cantOp: o => "I can't do \"" + o + "\" yet.",
      unknownFn: n => "I don't know the function \"" + n + "\".",
      fnOne: n => n + " needs one number.",
      notUnderstood: "I couldn't understand this problem.",
      tooLong: "This problem is too long for me.",
      // order of operations
      rParen: "Brackets first: ",
      rOrder: " (multiply and divide before adding and subtracting)",
      rPow: "Power", rSqrt: "Square root", rAbs: "Absolute value", rTrig: n => n + " (in degrees)", rNeg: "Minus sign",
      rMul: "Multiply", rMulFrac: "Multiplying fractions: numerator × numerator, denominator × denominator",
      rDiv: "Divide", rDivFrac: "Dividing by a fraction = multiplying by its reciprocal",
      rAdd: "Add", rSub: "Subtract", rSameDen: "Same denominator: work with the numerators",
      commonDen: (L, e) => "Common denominator " + L + ":  " + e,
      // equations
      alwaysEqual: "Both sides are always equal.",
      cancel: v => "The " + v + " terms cancel and the numbers don't match.",
      everyValue: v => "Every value of " + v + " works",
      noSolution: "No solution",
      subFrom: x => "Subtract " + x + " from both sides",
      addTo: x => "Add " + x + " to both sides",
      divide: x => "Divide both sides by " + x,
      multiply: x => "Multiply both sides by " + x,
      simplified: "After simplifying both sides",
      check: "Check: substitute the answer in the original equation",
      oneSide: "Move everything to one side",
      x2cancel: v => "Move everything to one side (the " + v + "² terms cancel)",
      coefs: "The coefficients",
      disc: "Discriminant",
      discNeg: "The discriminant is negative, so there is no real solution",
      noReal: "No real solution",
      discZero: "The discriminant is 0, so there is one solution",
      quadFormula: "Quadratic formula",
      or: "  or  ",
      noFound: "I couldn't find a solution to this equation.",
      numeric: v => "Found by trying values of " + v + " until both sides matched",
      matches: x => "That matches the right side (" + x + ") ✓",
      mismatch: (x, y) => "The right side says " + x + ", but the correct answer is " + y + ".",
      multiVars: l => "This has more than one unknown (" + l + "). I can only solve for one.",
      // algebra
      already: "This is already as simple as it gets.",
      rDist: "Distributive law",
      rExtDist: "Extended distributive law: multiply every term in the first bracket by every term in the second",
      rSquare: "Short multiplication formula: (a ± b)² = a² ± 2ab + b²",
      lcdMul: (d) => "Common denominator " + d + ": multiply every term by " + d,
      ratDomain: "Domain: a denominator can't be 0",
      ratMul: "Multiply both sides by the common denominator",
      ratBad: x => x + " is rejected: it makes a denominator 0",
      ratOk: "Check: the denominator isn't 0 ✓",
      fracFactor: "Take out the common factor in the numerator and the denominator",
      fracCancel: x => "Cancel the common factor (" + x + ")",
      fracCommon: "Common denominator: write as one fraction",
      sysNL: "Substitute and solve the equation with one unknown",
      sysPairs: "The solutions (each pair)",
      rMinus: " (a minus before the brackets flips every sign inside)",
      rCombine: "Combine like terms",
      left: "Left side: ", right: "Right side: ",
      // powers
      rProd: "Product of powers with the same base:  aˣ · aʸ = aˣ⁺ʸ",
      rQuot: "Quotient of powers with the same base:  aˣ : aʸ = aˣ⁻ʸ",
      rPowPow: "Power of a power:  (aˣ)ʸ = aˣ·ʸ",
      rPowProd: "Power of a product:  (a·b)ⁿ = aⁿ·bⁿ",
      rZero: "Power with exponent 0:  a⁰ = 1",
      rNegExp: "Power with a negative exponent:  a⁻ⁿ = 1/aⁿ",
      rCalc: "Calculate",
      // primes
      divBy: p => "Divisible by " + p,
      primeFact: "Prime factorization (equal factors written as a power)",
      isPrime: n => n + " is a prime number",
      multiEq: "This has more than one = sign.",
      emptySide: "One side of the = is empty.",
      generic: "I couldn't understand this one. Check the text and fix anything the camera misread.",
    },
    he: {
      divZero: "אי אפשר לחלק באפס.",
      tooBig: "התשובה גדולה מדי או לא מוגדרת.",
      powNoReal: "לחזקה הזו אין תשובה ממשית.",
      undefinedTrig: "אין לזה תשובה (הערך לא מוגדר).",
      negSqrt: "למספר שלילי אין שורש ריבועי ממשי.",
      noNumber: "לא הצלחתי לקרוא מספר בתרגיל.",
      unknownSym: n => "לא ברור לי מה זה \"" + n + "\" כאן.",
      cantOp: o => "עוד לא יודע לחשב \"" + o + "\".",
      unknownFn: n => "לא מכיר את הפונקציה \"" + n + "\".",
      fnOne: n => n + " צריך מספר אחד.",
      notUnderstood: "לא הצלחתי להבין את התרגיל.",
      tooLong: "התרגיל ארוך מדי בשבילי.",
      rParen: "קודם סוגריים: ",
      rOrder: " (כפל וחילוק לפני חיבור וחיסור)",
      rPow: "חזקה", rSqrt: "שורש ריבועי", rAbs: "ערך מוחלט", rTrig: n => n + " (במעלות)", rNeg: "סימן מינוס",
      rMul: "כפל", rMulFrac: "כפל שברים: מונה כפול מונה, מכנה כפול מכנה",
      rDiv: "חילוק", rDivFrac: "חילוק בשבר = כפל בשבר ההופכי",
      rAdd: "חיבור", rSub: "חיסור", rSameDen: "אותו מכנה: מחשבים את המונים",
      commonDen: (L, e) => "מכנה משותף " + L + ":  " + e,
      alwaysEqual: "שני האגפים תמיד שווים.",
      cancel: v => "האיברים עם " + v + " מתבטלים, והמספרים לא שווים.",
      everyValue: v => "כל ערך של " + v + " מתאים",
      noSolution: "אין פתרון",
      subFrom: x => "נחסר " + x + " משני האגפים",
      addTo: x => "נוסיף " + x + " לשני האגפים",
      divide: x => "נחלק את שני האגפים ב-" + x,
      multiply: x => "נכפול את שני האגפים ב-" + x,
      simplified: "אחרי פישוט שני האגפים",
      check: "בדיקה: הצבה במשוואה המקורית",
      oneSide: "נעביר הכול לאגף אחד",
      x2cancel: v => "נעביר הכול לאגף אחד (האיברים עם " + v + "² מתבטלים)",
      coefs: "המקדמים",
      disc: "דיסקרימיננטה",
      discNeg: "הדיסקרימיננטה שלילית, ולכן אין פתרון ממשי",
      noReal: "אין פתרון ממשי",
      discZero: "הדיסקרימיננטה היא 0, ולכן יש פתרון אחד",
      quadFormula: "נוסחת השורשים",
      or: "  או  ",
      noFound: "לא מצאתי פתרון למשוואה הזו.",
      numeric: v => "נמצא בניסוי ערכים של " + v + " עד ששני האגפים שווים",
      matches: x => "זה מתאים לאגף ימין (" + x + ") ✓",
      mismatch: (x, y) => "באגף ימין כתוב " + x + ", אבל התשובה הנכונה היא " + y + ".",
      multiVars: l => "יש כאן יותר מנעלם אחד (" + l + "). אני יודע לפתור רק עם נעלם אחד.",
      already: "התרגיל כבר מפושט עד הסוף.",
      rDist: "חוק הפילוג",
      rExtDist: "חוק הפילוג המורחב: כופלים כל איבר בסוגריים הראשונים בכל איבר בסוגריים השניים",
      rSquare: "נוסחת הכפל המקוצר: ⁦(a ± b)² = a² ± 2ab + b²⁩",
      lcdMul: (d) => "מכנה משותף " + d + ": כופלים כל איבר ב-" + d,
      ratDomain: "תחום הצבה: מכנה לא יכול להיות 0",
      ratMul: "נכפול את שני האגפים במכנה המשותף",
      ratBad: x => x + " נפסל: הוא מאפס מכנה",
      ratOk: "בדיקה: המכנה לא מתאפס ✓",
      fracFactor: "נוציא גורם משותף במונה ובמכנה",
      fracCancel: x => "נצמצם את הגורם המשותף (" + x + ")",
      fracCommon: "מכנה משותף: כותבים כשבר אחד",
      sysNL: "מציבים ופותרים משוואה עם נעלם אחד",
      sysPairs: "הפתרונות (כל זוג)",
      rMinus: " (מינוס לפני הסוגריים הופך את כל הסימנים בפנים)",
      rCombine: "כינוס איברים דומים",
      left: "אגף שמאל: ", right: "אגף ימין: ",
      rProd: "מכפלת חזקות בעלות אותו בסיס:  ⁦aˣ · aʸ = aˣ⁺ʸ⁩",
      rQuot: "מנה של חזקות בעלות אותו בסיס:  ⁦aˣ : aʸ = aˣ⁻ʸ⁩",
      rPowPow: "חזקה של חזקה:  ⁦(aˣ)ʸ = aˣ·ʸ⁩",
      rPowProd: "חזקה של מכפלה:  ⁦(a·b)ⁿ = aⁿ·bⁿ⁩",
      rZero: "חזקה בעלת מעריך 0:  ⁦a⁰ = 1⁩",
      rNegExp: "חזקה בעלת מעריך שלילי:  ⁦a⁻ⁿ = 1/aⁿ⁩",
      rCalc: "חישוב",
      divBy: p => "מתחלק ב-" + p,
      primeFact: "פירוק לגורמים ראשוניים (גורמים שווים כותבים כחזקה)",
      isPrime: n => n + " הוא מספר ראשוני",
      multiEq: "יש כאן יותר מסימן = אחד.",
      emptySide: "אחד האגפים של ה-= ריק.",
      generic: "לא הצלחתי להבין את התרגיל הזה. בדקו את הטקסט ותקנו מה שהמצלמה קראה לא נכון.",
    },
  };
  // ---------- grades 10–12: messages ----------
  const MSG2 = {
    en: {
      ineqMove: "Move the unknown to one side and the numbers to the other",
      ineqFlip: x => "Divide both sides by " + x + ". Dividing by a negative number flips the inequality sign",
      ineqAns: "The solution",
      ineqForm: "I couldn't read this inequality.",
      ineqRoots: e => "Find where it equals 0: " + e,
      ineqNoRoots: "It never equals 0, so its sign never changes",
      ineqZeros: "Where it equals 0 (the sign can change only here)",
      ineqBreaks: "Where it is undefined (the sign can also change here)",
      parUp: "a > 0: the parabola opens upward (∪): negative between the roots, positive outside them",
      parDown: "a < 0: the parabola opens downward (∩): positive between the roots, negative outside them",
      ineqSigns: "The sign in each range. Take the ranges that fit the inequality",
      isTrue: "This is true", isFalse: "This is false", trueW: "True", falseW: "False",
      sysArrange: i => "Equation (" + i + ") in the form ax + by = c",
      sysIsolate: (v, i) => "Isolate " + v + " from equation (" + i + ")",
      sysSub: i => "Substitute it into equation (" + i + ")",
      sysBack: v => "Substitute back to find " + v,
      sysMul: (i, k) => "Multiply equation (" + i + ") by " + k,
      sysElim: (add, v) => (add ? "Add" : "Subtract") + " the equations, so " + v + " cancels",
      sysNone: "The lines are parallel, so there is no solution",
      sysInf: "Both equations describe the same line",
      sysInfAns: "Infinitely many solutions",
      sysCheck: "Check in both equations",
      expSame: "Write both sides as powers of the same base",
      expEq: "Same base, so the exponents are equal",
      expLog: "Take the logarithm of both sides",
      expPos: "A power of a positive base is always positive, so there is no solution",
      expDiv: k => "Divide both sides by " + k,
      logDef: "Definition of a logarithm: log_b(A) = k means A = bᵏ",
      logEq: "The same logarithm on both sides, so what's inside is equal",
      logOk: "Check: the inside of the logarithm is positive ✓",
      logBad: x => x + " is rejected: the inside of the logarithm must be positive",
      rLogDef: (b, x, y) => "Because " + b + " to the power of " + y + " is " + x,
      rLog: "Logarithm", rFact: "Factorial: n! = n·(n−1)·…·1", rExp: "Power of e",
      trigBasic: "Find the basic angle α",
      trigIso: "Isolate the trig function",
      trigSinSol: "sin has two solutions in each cycle: α and 180° − α (+360°k)",
      trigCosSol: "cos has two solutions in each cycle: α and −α (+360°k)",
      trigTanSol: "tan repeats every 180°: α + 180°k",
      trigSolveX: v => "Solve for " + v,
      trigNo: "sin and cos are always between −1 and 1, so there is no solution",
      trigNum: "Found by checking every angle from 0° to 360°",
      trigRange: (a, b) => "The solutions between " + a + "° and " + b + "°",
      trigNoRange: "No solution in this range",
      kInt: "(k is any whole number)",
      fnGiven: "The function",
      rPowRule: "Power rule: (xⁿ)' = n·xⁿ⁻¹",
      rConstD: "The derivative of a number is 0",
      rSumD: "Derivative of a sum: derive each term separately",
      rProdD: "Product rule: (u·v)' = u'·v + u·v'",
      rQuotD: "Quotient rule: (u/v)' = (u'·v − u·v') / v²",
      rChainD: "Chain rule: derivative of the outside × derivative of the inside",
      rSinD: "(sin x)' = cos x", rCosD: "(cos x)' = −sin x", rTanD: "(tan x)' = 1/cos²x", rExpD: "(eˣ)' = eˣ",
      rLnD: "(ln x)' = 1/x", rSqrtD: "(√x)' = 1/(2√x)", rAxD: "(aˣ)' = aˣ·ln a", rLogD: "(log x)' = 1/(x·ln 10)",
      fDeriv: "The derivative",
      fAt: a => "Substitute x = " + a,
      slopeAt: "f'(x) at this point = the slope of the tangent there",
      tanPoint: "The point of tangency: substitute x in f(x)",
      tanSlope: "Slope of the tangent = f'(x) at the point",
      tanLine: "A line through a point: y − y₀ = m(x − x₀)",
      tanFinal: "The equation of the tangent",
      needPoint: "Write the point too, for example: tangent to f(x) = x² at x = 3",
      domAll: "Domain: every x",
      domNot: "Domain: a denominator can't be 0",
      domRoot: "Domain: under a square root ≥ 0, inside a logarithm > 0",
      crit: "Where f'(x) = 0 (possible extreme points)",
      noCrit: "f'(x) is never 0, so there are no extreme points",
      incdec: "Sign of f'(x): + means increasing ↗, − means decreasing ↘",
      extMax: "f' changes from + to −: maximum",
      extMin: "f' changes from − to +: minimum",
      extNone: "f' doesn't change sign: not an extreme point",
      yInt: "Meets the y-axis: substitute x = 0",
      xInt: "Meets the x-axis: solve f(x) = 0",
      noXInt: "The graph doesn't meet the x-axis",
      vAsym: "Vertical asymptote: where the denominator is 0",
      hAsym: "Horizontal asymptote: what f(x) approaches when x is very large",
      maxW: "max", minW: "min", noExt: "No extreme points", incW: "increasing", decW: "decreasing",
      intGiven: "The integral",
      intPow: "∫xⁿ dx = xⁿ⁺¹ ÷ (n+1)",
      intConst: "∫k dx = kx",
      intLn: "∫(1/x) dx = ln|x|",
      intSin: "∫sin(ax+b) dx = −cos(ax+b) ÷ a", intCos: "∫cos(ax+b) dx = sin(ax+b) ÷ a",
      intExp: "∫e^(ax+b) dx = e^(ax+b) ÷ a", intLinRec: "∫1/(ax+b) dx = ln|ax+b| ÷ a",
      intSum: "Integral of a sum: integrate each term separately",
      intC: "Add a constant C",
      intCant: "I can integrate powers of x, polynomials, sin, cos, eˣ and 1/x. This one is beyond me.",
      newton: "Definite integral = F(b) − F(a)",
      numInt: "Calculated numerically",
      areaSplit: "The graph crosses the x-axis inside the range: split there and take each part as positive",
      areaSum: "Area = sum of the parts",
      seqArith: d => "Arithmetic sequence: each term is the one before plus d = " + d,
      seqGeo: q => "Geometric sequence: each term is the one before times q = " + q,
      seqGeneral: "General term",
      seqNext: "The next terms",
      seqSumF: "Sum of the first n terms",
      seqFindD: "From two terms: d = (aₘ − aₖ) ÷ (m − k)",
      seqFindQ: "From two terms: qᵐ⁻ᵏ = aₘ ÷ aₖ",
      seqFindA1: "Find the first term from aₙ = a₁ + (n−1)d",
      seqFindA1g: "Find the first term from aₙ = a₁·qⁿ⁻¹",
      seqFindN: "Find n from the general term",
      seqFindNs: "Find n from the sum formula (n must be a positive whole number)",
      seqInf: "Infinite geometric sum (|q| < 1): S = a₁ ÷ (1 − q)",
      seqInfNo: "|q| ≥ 1, so the infinite sum has no limit",
      seqNeed: "I need more givens: for example a₁ and d (or q), or two terms like a₃ = 7, a₈ = 22.",
      seqBadN: "There's no whole n that fits.",
      slope: "Slope: m = (y₂ − y₁) ÷ (x₂ − x₁)",
      lineEq: "A line through a point with slope m: y − y₁ = m(x − x₁)",
      vertLine: "Both points have the same x: a vertical line",
      dist: "Distance: d = √((x₂ − x₁)² + (y₂ − y₁)²)",
      mid: "Midpoint: ((x₁ + x₂) ÷ 2 , (y₁ + y₂) ÷ 2)",
      lineSlope: "In the form y = mx + b: m is the slope, b is where it meets the y-axis",
      xIntLine: "Meets the x-axis: y = 0",
      circleStd: "Complete the square for x and for y",
      circleRes: "(x − a)² + (y − b)² = R²: center (a, b), radius R",
      circleNo: "R² isn't positive, so this isn't a circle",
      circleEq: "Equation of a circle with center (a, b) and radius R",
      parVertex: "Vertex: x = −b ÷ 2a, then substitute",
      parOpen: up => up ? "a > 0: opens upward (∪), the vertex is the lowest point" : "a < 0: opens downward (∩), the vertex is the highest point",
      perpSlope: "Perpendicular lines: m₁ · m₂ = −1",
      parSlope: "Parallel lines have the same slope",
      triSides: "Side lengths (distance formula)",
      triArea: "Area from coordinates: ½|x₁(y₂ − y₃) + x₂(y₃ − y₁) + x₃(y₁ − y₂)|",
      triRight: "Pythagoras holds: it's a right triangle",
      centerW: "center", radiusW: "radius", slopeW: "slope", vertexW: "vertex", distW: "distance", midW: "midpoint", areaW: "area",
      factDef: "n! = n·(n−1)·…·2·1",
      combDef: "Choosing k out of n, order doesn't matter: C(n,k) = n! ÷ (k!·(n−k)!)",
      permDef: "Arranging k out of n, order matters: P(n,k) = n! ÷ (n−k)!",
      combBig: "These numbers are too big.",
      sortedW: "Sorted", countW: "Number of values", sumW: "Sum",
      mean: "Mean = sum ÷ number of values",
      median: "Median: the middle value (with an even count, the mean of the two middle values)",
      mode: "Mode: the value that appears most often", noMode: "No value repeats, so there's no mode",
      range: "Range = largest − smallest",
      variance: "Variance: the mean of the squared distances from the mean",
      sd: "Standard deviation = √variance",
      meanW: "mean", medianW: "median", sdW: "standard deviation",
      logNeg: "A logarithm needs a positive number.",
    },
    he: {
      ineqMove: "נעביר את הנעלם לאגף אחד ואת המספרים לאגף השני",
      ineqFlip: x => "נחלק את שני האגפים ב-" + x + ". חילוק במספר שלילי הופך את סימן אי-השוויון",
      ineqAns: "הפתרון",
      ineqForm: "לא הצלחתי לקרוא את אי-השוויון.",
      ineqRoots: e => "נמצא איפה הביטוי שווה 0: " + e,
      ineqNoRoots: "הביטוי אף פעם לא שווה 0, ולכן הסימן שלו לא משתנה",
      ineqZeros: "איפה הביטוי שווה 0 (רק שם הסימן יכול להשתנות)",
      ineqBreaks: "איפה הביטוי לא מוגדר (גם שם הסימן יכול להשתנות)",
      parUp: "⁦a > 0⁩: פרבולה מחייכת ⁦(∪)⁩: שלילית בין השורשים וחיובית מחוץ להם",
      parDown: "⁦a < 0⁩: פרבולה עצובה ⁦(∩)⁩: חיובית בין השורשים ושלילית מחוץ להם",
      ineqSigns: "הסימן בכל תחום. לוקחים את התחומים שמתאימים לאי-השוויון",
      isTrue: "זה נכון", isFalse: "זה לא נכון", trueW: "נכון", falseW: "לא נכון",
      sysArrange: i => "משוואה (" + i + ") בצורה ⁦ax + by = c⁩",
      sysIsolate: (v, i) => "נבודד את " + v + " ממשוואה (" + i + ")",
      sysSub: i => "נציב במשוואה (" + i + ")",
      sysBack: v => "נציב חזרה כדי למצוא את " + v,
      sysMul: (i, k) => "נכפול את משוואה (" + i + ") ב-" + k,
      sysElim: (add, v) => (add ? "נחבר" : "נחסר") + " את המשוואות, כך ש-" + v + " מתבטל",
      sysNone: "הישרים מקבילים, ולכן אין פתרון",
      sysInf: "שתי המשוואות מתארות את אותו ישר",
      sysInfAns: "אינסוף פתרונות",
      sysCheck: "בדיקה בשתי המשוואות",
      expSame: "נכתוב את שני האגפים כחזקות של אותו בסיס",
      expEq: "אותו בסיס, ולכן המעריכים שווים",
      expLog: "נוציא לוגריתם משני האגפים",
      expPos: "חזקה של בסיס חיובי תמיד חיובית, ולכן אין פתרון",
      expDiv: k => "נחלק את שני האגפים ב-" + k,
      logDef: "הגדרת הלוגריתם: ⁦log_b(A) = k⁩ פירושו ⁦A = bᵏ⁩",
      logEq: "אותו לוגריתם בשני האגפים, ולכן מה שבפנים שווה",
      logOk: "בדיקה: הביטוי בתוך הלוגריתם חיובי ✓",
      logBad: x => x + " נפסל: הביטוי בתוך הלוגריתם חייב להיות חיובי",
      rLogDef: (b, x, y) => "כי " + b + " בחזקת " + y + " שווה " + x,
      rLog: "לוגריתם", rFact: "עצרת: ⁦n! = n·(n−1)·…·1⁩", rExp: "חזקה של e",
      trigBasic: "נמצא את הזווית הבסיסית α",
      trigIso: "נבודד את הפונקציה הטריגונומטרית",
      trigSinSol: "ל-sin יש שני פתרונות בכל מחזור: α ו-⁦180° − α⁩ ⁦(+360°k)⁩",
      trigCosSol: "ל-cos יש שני פתרונות בכל מחזור: α ו-⁦−α⁩ ⁦(+360°k)⁩",
      trigTanSol: "tan חוזר על עצמו כל ⁦180°⁩: ⁦α + 180°k⁩",
      trigSolveX: v => "נבודד את " + v,
      trigNo: "sin ו-cos תמיד בין ⁦−1⁩ ל-1, ולכן אין פתרון",
      trigNum: "נמצא בבדיקה של כל הזוויות מ-⁦0°⁩ עד ⁦360°⁩",
      trigRange: (a, b) => "הפתרונות בין ⁦" + a + "°⁩ ל-⁦" + b + "°⁩",
      trigNoRange: "אין פתרון בתחום הזה",
      kInt: "(k מספר שלם)",
      fnGiven: "הפונקציה",
      rPowRule: "נגזרת של חזקה: ⁦(xⁿ)' = n·xⁿ⁻¹⁩",
      rConstD: "הנגזרת של מספר היא 0",
      rSumD: "נגזרת של סכום: גוזרים כל איבר בנפרד",
      rProdD: "נגזרת של מכפלה: ⁦(u·v)' = u'·v + u·v'⁩",
      rQuotD: "נגזרת של מנה: ⁦(u/v)' = (u'·v − u·v') / v²⁩",
      rChainD: "כלל השרשרת: נגזרת החיצונית כפול נגזרת הפנימית",
      rSinD: "⁦(sin x)' = cos x⁩", rCosD: "⁦(cos x)' = −sin x⁩", rTanD: "⁦(tan x)' = 1/cos²x⁩", rExpD: "⁦(eˣ)' = eˣ⁩",
      rLnD: "⁦(ln x)' = 1/x⁩", rSqrtD: "⁦(√x)' = 1/(2√x)⁩", rAxD: "⁦(aˣ)' = aˣ·ln a⁩", rLogD: "⁦(log x)' = 1/(x·ln 10)⁩",
      fDeriv: "הנגזרת",
      fAt: a => "נציב ⁦x = " + a + "⁩",
      slopeAt: "הנגזרת בנקודה = שיפוע המשיק בה",
      tanPoint: "נקודת ההשקה: מציבים את x בפונקציה",
      tanSlope: "שיפוע המשיק = הנגזרת בנקודה",
      tanLine: "ישר דרך נקודה: ⁦y − y₀ = m(x − x₀)⁩",
      tanFinal: "משוואת המשיק",
      needPoint: "כתבו גם את הנקודה, למשל: משיק ל-⁦f(x) = x²⁩ בנקודה ⁦x = 3⁩",
      domAll: "תחום הגדרה: כל x",
      domNot: "תחום הגדרה: מכנה לא יכול להיות 0",
      domRoot: "תחום הגדרה: מתחת לשורש ⁦≥ 0⁩, בתוך לוגריתם ⁦> 0⁩",
      crit: "איפה ⁦f'(x) = 0⁩ (נקודות קיצון אפשריות)",
      noCrit: "⁦f'(x)⁩ אף פעם לא 0, ולכן אין נקודות קיצון",
      incdec: "סימן הנגזרת: + עולה ↗, − יורדת ↘",
      extMax: "הנגזרת עוברת מ-+ ל-−: מקסימום",
      extMin: "הנגזרת עוברת מ-− ל-+: מינימום",
      extNone: "הנגזרת לא מחליפה סימן: לא נקודת קיצון",
      yInt: "חיתוך עם ציר y: מציבים ⁦x = 0⁩",
      xInt: "חיתוך עם ציר x: פותרים ⁦f(x) = 0⁩",
      noXInt: "הגרף לא חותך את ציר x",
      vAsym: "אסימפטוטה אנכית: איפה שהמכנה מתאפס",
      hAsym: "אסימפטוטה אופקית: לאן ⁦f(x)⁩ שואפת כש-x גדול מאוד",
      maxW: "מקסימום", minW: "מינימום", noExt: "אין נקודות קיצון", incW: "עולה", decW: "יורדת",
      intGiven: "האינטגרל",
      intPow: "⁦∫xⁿ dx = xⁿ⁺¹ ÷ (n+1)⁩",
      intConst: "⁦∫k dx = kx⁩",
      intLn: "⁦∫(1/x) dx = ln|x|⁩",
      intSin: "⁦∫sin(ax+b) dx = −cos(ax+b) ÷ a⁩", intCos: "⁦∫cos(ax+b) dx = sin(ax+b) ÷ a⁩",
      intExp: "⁦∫e^(ax+b) dx = e^(ax+b) ÷ a⁩", intLinRec: "⁦∫1/(ax+b) dx = ln|ax+b| ÷ a⁩",
      intSum: "אינטגרל של סכום: מחשבים כל איבר בנפרד",
      intC: "מוסיפים קבוע C",
      intCant: "אני יודע לחשב אינטגרל של חזקות של x, פולינומים, sin, cos, ⁦eˣ⁩ ו-⁦1/x⁩. את זה עוד לא.",
      newton: "אינטגרל מסוים = ⁦F(b) − F(a)⁩",
      numInt: "חושב בקירוב מספרי",
      areaSplit: "הגרף חותך את ציר x בתוך התחום: מחלקים שם ולוקחים כל חלק בערך מוחלט",
      areaSum: "השטח = סכום החלקים",
      seqArith: d => "סדרה חשבונית: כל איבר שווה לקודם ועוד ⁦d = " + d + "⁩",
      seqGeo: q => "סדרה הנדסית: כל איבר שווה לקודם כפול ⁦q = " + q + "⁩",
      seqGeneral: "האיבר הכללי",
      seqNext: "האיברים הבאים",
      seqSumF: "סכום n האיברים הראשונים",
      seqFindD: "משני איברים: ⁦d = (aₘ − aₖ) ÷ (m − k)⁩",
      seqFindQ: "משני איברים: ⁦qᵐ⁻ᵏ = aₘ ÷ aₖ⁩",
      seqFindA1: "נמצא את האיבר הראשון מ-⁦aₙ = a₁ + (n−1)d⁩",
      seqFindA1g: "נמצא את האיבר הראשון מ-⁦aₙ = a₁·qⁿ⁻¹⁩",
      seqFindN: "נמצא את n מנוסחת האיבר הכללי",
      seqFindNs: "נמצא את n מנוסחת הסכום (n חייב להיות מספר שלם חיובי)",
      seqInf: "סכום סדרה הנדסית אינסופית ⁦(|q| < 1)⁩: ⁦S = a₁ ÷ (1 − q)⁩",
      seqInfNo: "⁦|q| ≥ 1⁩, ולכן לסכום האינסופי אין גבול",
      seqNeed: "חסרים נתונים: למשל ⁦a₁⁩ ו-d (או q), או שני איברים כמו ⁦a₃ = 7, a₈ = 22⁩.",
      seqBadN: "אין n שלם שמתאים.",
      slope: "שיפוע: ⁦m = (y₂ − y₁) ÷ (x₂ − x₁)⁩",
      lineEq: "ישר דרך נקודה עם שיפוע m: ⁦y − y₁ = m(x − x₁)⁩",
      vertLine: "לשתי הנקודות אותו x: ישר אנכי",
      dist: "מרחק: ⁦d = √((x₂ − x₁)² + (y₂ − y₁)²)⁩",
      mid: "אמצע קטע: ⁦((x₁ + x₂) ÷ 2 , (y₁ + y₂) ÷ 2)⁩",
      lineSlope: "בצורה ⁦y = mx + b⁩: m הוא השיפוע, b הוא החיתוך עם ציר y",
      xIntLine: "חיתוך עם ציר x: ⁦y = 0⁩",
      circleStd: "נשלים לריבוע את x ואת y",
      circleRes: "⁦(x − a)² + (y − b)² = R²⁩: מרכז ⁦(a, b)⁩, רדיוס R",
      circleNo: "⁦R²⁩ לא חיובי, ולכן זה לא מעגל",
      circleEq: "משוואת מעגל עם מרכז ⁦(a, b)⁩ ורדיוס R",
      parVertex: "קודקוד: ⁦x = −b ÷ 2a⁩, ואז מציבים",
      parOpen: up => up ? "⁦a > 0⁩: פרבולה מחייכת ⁦(∪)⁩, הקודקוד הוא הנקודה הנמוכה" : "⁦a < 0⁩: פרבולה עצובה ⁦(∩)⁩, הקודקוד הוא הנקודה הגבוהה",
      perpSlope: "ישרים מאונכים: ⁦m₁ · m₂ = −1⁩",
      parSlope: "לישרים מקבילים אותו שיפוע",
      triSides: "אורכי הצלעות (נוסחת המרחק)",
      triArea: "שטח לפי קודקודים: ⁦½|x₁(y₂ − y₃) + x₂(y₃ − y₁) + x₃(y₁ − y₂)|⁩",
      triRight: "משפט פיתגורס מתקיים: המשולש ישר-זווית",
      centerW: "מרכז", radiusW: "רדיוס", slopeW: "שיפוע", vertexW: "קודקוד", distW: "מרחק", midW: "אמצע", areaW: "שטח",
      factDef: "⁦n! = n·(n−1)·…·2·1⁩",
      combDef: "בחירת k מתוך n כשהסדר לא חשוב: ⁦C(n,k) = n! ÷ (k!·(n−k)!)⁩",
      permDef: "סידור k מתוך n כשהסדר חשוב: ⁦P(n,k) = n! ÷ (n−k)!⁩",
      combBig: "המספרים גדולים מדי.",
      sortedW: "ממוינים", countW: "מספר הערכים", sumW: "סכום",
      mean: "ממוצע = סכום ÷ מספר הערכים",
      median: "חציון: הערך האמצעי (כשמספר הערכים זוגי, הממוצע של שני האמצעיים)",
      mode: "שכיח: הערך שמופיע הכי הרבה פעמים", noMode: "אף ערך לא חוזר, ולכן אין שכיח",
      range: "טווח = הגדול ביותר − הקטן ביותר",
      variance: "שונות: ממוצע ריבועי המרחקים מהממוצע",
      sd: "סטיית תקן = שורש השונות",
      meanW: "ממוצע", medianW: "חציון", sdW: "סטיית תקן",
      logNeg: "לוגריתם מוגדר רק למספר חיובי.",
    },
  };
  Object.assign(MSG.en, MSG2.en);
  Object.assign(MSG.he, MSG2.he);
  function t(k) {
    const m = (MSG[LANG] && MSG[LANG][k]) || MSG.en[k];
    return typeof m === "function" ? m.apply(null, [].slice.call(arguments, 1)) : m;
  }
  function fail(msg) { const e = new Error(msg); e.friendly = true; throw e; }

  // ---------- exact numbers (fractions) with float fallback ----------
  function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { const x = a % b; a = b; b = x; } return a; }
  const SAFE = 1e15;
  function rat(n, d) {
    if (d === undefined) d = 1;
    if (d === 0) fail(t("divZero"));
    if (d < 0) { n = -n; d = -d; }
    const g = gcd(n, d) || 1; n /= g; d /= g;
    if (Math.abs(n) > SAFE || d > SAFE) return flt(n / d);
    return { exact: true, n: n === 0 ? 0 : n, d };
  }
  function flt(v) { if (!isFinite(v)) fail(t("tooBig")); return { exact: false, v }; }
  function val(a) { return a.exact ? a.n / a.d : a.v; }
  function fromNumber(x) {
    if (Number.isInteger(x)) return rat(x, 1);
    const m = String(x).match(/^-?\d+\.(\d{1,6})$/);
    if (m) { const k = Math.pow(10, m[1].length); return rat(Math.round(x * k), k); }
    return flt(x);
  }
  function approxRat(x) {
    if (!isFinite(x)) return flt(x);
    for (let d = 1; d <= 1000; d++) { const n = Math.round(x * d); if (Math.abs(n / d - x) < 1e-9 * Math.max(1, Math.abs(x))) return rat(n, d); }
    return flt(x);
  }
  function round(v) { let r = Math.round(v * 1e4) / 1e4; if (Object.is(r, -0)) r = 0; return String(r).replace("-", "−"); }
  function fmt(a) { if (!a.exact) return round(a.v); const s = a.d === 1 ? String(a.n) : a.n + "/" + a.d; return s.replace("-", "−"); }
  function fmtShort(a) { return a.exact ? fmt(a) : "≈ " + round(a.v); }
  function fmtFull(a) {
    if (!a.exact) return "≈ " + round(a.v);
    if (a.d === 1) return fmt(a);
    let s = fmt(a);
    const w = Math.trunc(a.n / a.d);
    if (w !== 0) s += " = " + String(w).replace("-", "−") + " " + Math.abs(a.n % a.d) + "/" + a.d;
    return s + " ≈ " + round(a.n / a.d);
  }
  function paren(a) { return val(a) < 0 || (a.exact && a.d !== 1) ? "(" + fmt(a) + ")" : fmt(a); }
  const neg = a => ops.multiply(rat(-1), a);
  const abs = a => (val(a) < 0 ? neg(a) : a);
  const isInt = a => a.exact && a.d === 1;

  const ops = {
    add: (a, b) => (a.exact && b.exact ? rat(a.n * b.d + b.n * a.d, a.d * b.d) : flt(val(a) + val(b))),
    subtract: (a, b) => (a.exact && b.exact ? rat(a.n * b.d - b.n * a.d, a.d * b.d) : flt(val(a) - val(b))),
    multiply: (a, b) => (a.exact && b.exact ? rat(a.n * b.n, a.d * b.d) : flt(val(a) * val(b))),
    divide: (a, b) => {
      if (val(b) === 0) fail(t("divZero"));
      return a.exact && b.exact ? rat(a.n * b.d, a.d * b.n) : flt(val(a) / val(b));
    },
    pow: (a, b) => {
      if (a.exact && isInt(b) && Math.abs(b.n) <= 40) {
        const k = Math.abs(b.n); let n = Math.pow(a.n, k), d = Math.pow(a.d, k);
        if (b.n < 0) { if (n === 0) fail(t("divZero")); [n, d] = [d, n]; }
        if (Number.isSafeInteger(n) && Number.isSafeInteger(d)) return rat(n, d);
      }
      if (val(a) < 0 && !isInt(b)) fail(t("powNoReal"));
      return flt(Math.pow(val(a), val(b)));
    },
  };
  const DEG = Math.PI / 180;
  function trig(f) { return a => { const r = f(val(a) * DEG); if (Math.abs(r) > 1e10) fail(t("undefinedTrig")); return approxRat(r); }; }
  const fns = {
    sqrt: a => {
      if (val(a) < 0) fail(t("negSqrt"));
      if (a.exact) { const n = Math.round(Math.sqrt(a.n)), d = Math.round(Math.sqrt(a.d)); if (n * n === a.n && d * d === a.d) return rat(n, d); }
      return flt(Math.sqrt(val(a)));
    },
    abs: a => abs(a),
    sin: trig(Math.sin), cos: trig(Math.cos), tan: trig(Math.tan),
    log10: a => logVal(a, 10), log: a => logVal(a, Math.E), log2: a => logVal(a, 2), logb: (a, b) => logVal(a, b),
    exp: a => approxRat(Math.exp(val(a))),
    fact: a => {
      if (!isInt(a) || a.n < 0 || a.n > 170) fail(t("combBig"));
      let r = 1; for (let k = 2; k <= a.n; k++) r *= k;
      return Number.isSafeInteger(r) ? rat(r) : flt(r);
    },
  };
  function logVal(a, b) { if (val(a) <= 0) fail(t("logNeg")); return approxRat(Math.log(val(a)) / Math.log(b)); }
  const KNOWN = new Set(["sqrt", "abs", "sin", "cos", "tan", "pi", "e", "log", "log10", "log2", "logb", "exp"]);

  // ---------- superscripts ----------
  const SUPM = { "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴", "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹", "-": "⁻", "−": "⁻", "+": "⁺", "(": "⁽", ")": "⁾" };
  function sup(str) { str = String(str); return /^[0-9+\-−()]+$/.test(str) ? str.split("").map(c => SUPM[c]).join("") : "^(" + str + ")"; }
  function powStr(base, e) { return isInt(e) && e.n === 1 ? base : base + (isInt(e) ? sup(e.n) : "^(" + fmt(e) + ")"); }

  // ---------- step-by-step arithmetic (order of operations) ----------
  const SYM = { add: "+", subtract: "−", multiply: "×", divide: "÷" };
  const PREC = { add: 1, subtract: 1, multiply: 2, divide: 2, neg: 3, pow: 4 };

  function convert(node) {
    switch (node.type) {
      case "ParenthesisNode": { const c = convert(node.content); c.paren = true; return c; }
      case "ConstantNode":
        if (typeof node.value !== "number") fail(t("noNumber"));
        return { t: "c", v: fromNumber(node.value) };
      case "SymbolNode":
        if (node.name === "pi") return { t: "c", v: flt(Math.PI), label: "π" };
        if (node.name === "e") return { t: "c", v: flt(Math.E), label: "e" };
        fail(t("unknownSym", node.name));
        break;
      case "OperatorNode": {
        const args = node.args.map(convert);
        if (node.fn === "unaryPlus") return args[0];
        if (node.fn === "factorial") return { t: "fn", name: "fact", args };
        if (node.fn === "unaryMinus") return args[0].t === "c" && !args[0].label ? { t: "c", v: neg(args[0].v) } : { t: "op", op: "neg", args };
        if (!(node.fn in ops)) fail(t("cantOp", node.op));
        return { t: "op", op: node.fn, args };
      }
      case "FunctionNode": {
        const name = node.fn && node.fn.name;
        if (name === "frac") return { t: "c", v: rat(node.args[0].value, node.args[1].value) };
        if (name === "logb" && node.args.length === 2 && node.args[1].type === "ConstantNode") return { t: "fn", name, base: Number(node.args[1].value), args: [convert(node.args[0])] };
        if (!fns[name]) fail(t("unknownFn", name));
        if (node.args.length !== 1) fail(t("fnOne", name));
        return { t: "fn", name, args: node.args.map(convert) };
      }
    }
    fail(t("notUnderstood"));
  }

  function show(n, minP, right, hasParent) {
    minP = minP || 0;
    let s, p;
    if (n.t === "c") {
      s = n.label || fmt(n.v);
      if (!n.label && val(n.v) < 0 && hasParent) return "(" + s + ")";
      p = n.v.exact && n.v.d !== 1 ? 2 : 5;
    } else if (n.t === "fn") {
      const inner = show(n.args[0]);
      if (n.name === "fact") return (n.args[0].t === "c" ? inner : "(" + inner + ")") + "!";
      if (n.name === "abs") return "|" + inner + "|";
      const LN = { log10: "log", log: "ln", log2: "log₂", logb: "log" + subs(n.base), exp: "exp" };
      if (LN[n.name]) return LN[n.name] + "(" + inner + ")";
      return n.name === "sqrt" ? "√(" + inner + ")" : n.name + "(" + inner + "°)";
    } else if (n.op === "neg") {
      p = 3; s = "−" + show(n.args[0], 4, true, true);
    } else if (n.op === "pow") {
      p = 4;
      const [a, b] = n.args;
      const base = show(a, 5, false, true);
      s = b.t === "c" && isInt(b.v) ? base + sup(b.v.n) : base + "^" + show(b, 5, true, true);
    } else {
      p = PREC[n.op];
      const [a, b] = n.args;
      const rightMin = n.op === "subtract" || n.op === "divide" ? p + 1 : p;
      s = show(a, p, false, true) + " " + SYM[n.op] + " " + show(b, rightMin, true, true);
    }
    return p < minP ? "(" + s + ")" : s;
  }

  function reducible(n) { return (n.t === "op" || n.t === "fn") && n.args.every(a => a.t === "c"); }
  function rank(n) { return n.t === "fn" ? 5 : PREC[n.op]; }
  function findBest(n, best) {
    if (n.t === "c") return best;
    if (reducible(n)) return !best || rank(n) > rank(best) ? n : best;
    for (const a of n.args) best = findBest(a, best);
    return best;
  }
  function hasOp(n, set) { return n.t !== "c" && ((n.t === "op" && set.has(n.op)) || n.args.some(a => hasOp(a, set))); }
  const ADDSUB = new Set(["add", "subtract"]);

  function stepReason(b, tree) {
    const [x, y] = b.args;
    let r;
    if (b.t === "fn") {
      const base = { log10: 10, log: "e", log2: 2, logb: b.base }[b.name];
      if (base !== undefined) {
        const y = fns[b.name](x.v, b.base);
        r = isInt(y) && base !== "e" ? t("rLogDef", iso(String(base)), iso(fmt(x.v)), iso(fmt(y))) : t("rLog");
      } else r = b.name === "sqrt" ? t("rSqrt") : b.name === "abs" ? t("rAbs") : b.name === "fact" ? t("rFact") : b.name === "exp" ? t("rExp") : t("rTrig", b.name);
    }
    else if (b.op === "neg") r = t("rNeg");
    else if (b.op === "pow") r = t("rPow");
    else if (b.op === "multiply") r = (x.v.exact && x.v.d !== 1) || (y.v.exact && y.v.d !== 1) ? t("rMulFrac") : t("rMul");
    else if (b.op === "divide") r = y.v.exact && y.v.d !== 1 ? t("rDivFrac") : t("rDiv");
    else {
      if (x.v.exact && y.v.exact && x.v.d !== y.v.d) {
        const L = (x.v.d / gcd(x.v.d, y.v.d)) * y.v.d;
        r = t("commonDen", L, iso(fmt(rat(x.v.n * (L / x.v.d), 1)) + "/" + L + " " + SYM[b.op] + " " + fmt(rat(y.v.n * (L / y.v.d), 1)) + "/" + L));
      } else if (x.v.exact && y.v.exact && x.v.d !== 1) r = t("rSameDen");
      else r = b.op === "add" ? t("rAdd") : t("rSub");
    }
    if ((b.op === "multiply" || b.op === "divide") && hasOp(tree, ADDSUB) && !b.paren) r += t("rOrder");
    if (b.paren && tree !== b) r = t("rParen") + r;
    return r;
  }

  function arithmetic(expr) {
    const tree = convert(M().parse(expr));
    const steps = [];
    let guard = 0;
    while (tree.t !== "c") {
      if (guard++ > 80) fail(t("tooLong"));
      const b = findBest(tree, null);
      const reason = stepReason(b, tree);
      const x = b.args[0], y = b.args[1];
      const v = b.t === "fn" ? fns[b.name](x.v, b.base) : b.op === "neg" ? neg(x.v) : ops[b.op](x.v, y.v);
      const keepParen = b.paren;
      for (const k of Object.keys(b)) delete b[k];
      b.t = "c"; b.v = v; if (keepParen) b.paren = true;
      steps.push(["= " + show(tree), reason]);
    }
    return { answer: fmtFull(tree.v), steps, value: tree.v };
  }

  // ---------- prime factorization ----------
  function factorize(n) {
    const steps = [], f = new Map();
    let cur = n;
    for (let p = 2; p * p <= cur; p++) {
      while (cur % p === 0) { steps.push([cur + " ÷ " + p + " = " + cur / p, t("divBy", p)]); f.set(p, (f.get(p) || 0) + 1); cur /= p; }
    }
    if (cur > 1) f.set(cur, (f.get(cur) || 0) + 1);
    if (f.size === 1 && [...f.values()][0] === 1) return { answer: t("isPrime", n), steps: [[String(n), t("isPrime", n)]] };
    if (cur > 1 && steps.length) steps.push([cur + " ÷ " + cur + " = 1", t("divBy", cur)]);
    const out = [...f.entries()].map(([p, e]) => (e === 1 ? String(p) : p + sup(e))).join(" · ");
    steps.push([n + " = " + out, t("primeFact")]);
    return { answer: n + " = " + out, steps };
  }

  // ---------- power laws (monomials) ----------
  function unparen(n) { while (n.type === "ParenthesisNode") n = n.content; return n; }
  function constVal(node) { // exponent / constant as exact value, or null
    try { const tr = convert(node); if (tr.t === "c") return tr.v; return arithmetic(node.toString()).value; } catch (e) { return null; }
  }
  function monoStr(m) {
    const num = [], den = [];
    for (const [b, e] of m.pw) (val(e) > 0 ? num : den).push(powStr(b, val(e) > 0 ? e : neg(e)));
    const c = m.coef; let cs = "";
    const cn = c.exact ? c.n : c.v, cd = c.exact ? c.d : 1;
    const cAbs = c.exact ? String(Math.abs(cn)) : round(Math.abs(cn));
    let top = num.join(" · "); const bot = den.join(" · ");
    if (!top) top = cAbs;
    else if (Math.abs(cn) !== 1) top = cAbs + top;
    if (cn < 0) cs = "−";
    let bottom = bot;
    if (cd !== 1) bottom = bottom ? cd + bottom : String(cd);
    if (!bottom) return cs + top;
    const wrap = s => (s.includes(" ") ? "(" + s + ")" : s);
    return cs + wrap(top) + "/" + wrap(bottom);
  }
  function monoOf(node, steps, numBases) {
    node = unparen(node);
    if (node.type === "ConstantNode") {
      if (typeof node.value !== "number") return null;
      const v = fromNumber(node.value);
      if (isInt(v) && numBases.has(String(v.n))) return { coef: rat(1), pw: new Map([[String(v.n), rat(1)]]) };
      return { coef: v, pw: new Map() };
    }
    if (node.type === "SymbolNode") {
      if (KNOWN.has(node.name)) return null;
      return { coef: rat(1), pw: new Map([[node.name, rat(1)]]) };
    }
    if (node.type !== "OperatorNode") return null;
    if (node.fn === "unaryMinus") { const a = monoOf(node.args[0], steps, numBases); if (a) a.coef = neg(a.coef); return a; }
    if (node.fn === "multiply" || node.fn === "divide") {
      const a = monoOf(node.args[0], steps, numBases), b = monoOf(node.args[1], steps, numBases);
      if (!a || !b) return null;
      const out = { coef: node.fn === "multiply" ? ops.multiply(a.coef, b.coef) : ops.divide(a.coef, b.coef), pw: new Map(a.pw) };
      for (const [base, e] of b.pw) {
        if (out.pw.has(base)) {
          const x = out.pw.get(base), r = node.fn === "multiply" ? ops.add(x, e) : ops.subtract(x, e);
          const opS = node.fn === "multiply" ? " · " : " : ";
          const expr = fmt(x) + (node.fn === "multiply" ? "+" : "−") + paren(e);
          steps.push([powStr(base, x) + opS + powStr(base, e) + " = " + base + sup(expr) + " = " + powStr(base, r), node.fn === "multiply" ? t("rProd") : t("rQuot")]);
          out.pw.set(base, r);
        } else out.pw.set(base, node.fn === "multiply" ? e : neg(e));
      }
      return out;
    }
    if (node.fn === "pow") {
      const e = constVal(node.args[1]);
      if (!e || !e.exact) return null;
      const base = unparen(node.args[0]);
      if (base.type === "SymbolNode" && !KNOWN.has(base.name)) return { coef: rat(1), pw: new Map([[base.name, e]]) };
      if (base.type === "ConstantNode" && typeof base.value === "number" && Number.isInteger(base.value) && base.value > 0)
        return { coef: rat(1), pw: new Map([[String(base.value), e]]) };
      const inner = monoOf(base, steps, numBases);
      if (!inner) return null;
      const before = monoStr(inner);
      const out = { coef: ops.pow(inner.coef, e), pw: new Map() };
      for (const [b, x] of inner.pw) out.pw.set(b, ops.multiply(x, e));
      const single = inner.pw.size === 1 && isInt(inner.coef) && inner.coef.n === 1;
      if (single) {
        const [b, x] = [...inner.pw][0];
        steps.push(["(" + before + ")" + sup(fmt(e)) + " = " + b + "^(" + fmt(x) + "·" + paren(e) + ") = " + powStr(b, ops.multiply(x, e)), t("rPowPow")]);
      } else steps.push(["(" + before + ")" + (isInt(e) ? sup(e.n) : "^(" + fmt(e) + ")") + " = " + monoStr(out), t("rPowProd")]);
      return out;
    }
    return null;
  }
  function powers(expr) {
    const root = M().parse(expr);
    let hasPow = false, hasAdd = false, hasVarDiv = false;
    const numBases = new Set();
    root.traverse(n => {
      if (n.type === "OperatorNode" && n.fn === "pow") {
        hasPow = true; const b = unparen(n.args[0]);
        if (b.type === "ConstantNode" && Number.isInteger(b.value)) numBases.add(String(b.value));
      }
      if (n.type === "OperatorNode" && (n.fn === "add" || n.fn === "subtract")) hasAdd = true;
      if (n.type === "OperatorNode" && n.fn === "divide" && n.args[1].filter(x => x.type === "SymbolNode").length) hasVarDiv = true;
    });
    if (hasAdd || !(hasPow || hasVarDiv)) return null;
    const steps = [];
    const m = monoOf(root, steps, numBases);
    if (!m) return null;
    for (const [b, e] of [...m.pw]) {
      if (val(e) === 0) { steps.push([b + "⁰ = 1", t("rZero")]); m.pw.delete(b); }
    }
    for (const [b, e] of m.pw) if (val(e) < 0) steps.push([powStr(b, e) + " = 1/" + powStr(b, neg(e)), t("rNegExp")]);
    const shown = monoStr(m);
    const allNum = [...m.pw.keys()].every(b => /^\d+$/.test(b));
    if (allNum && m.pw.size) {
      let v = m.coef;
      for (const [b, e] of m.pw) v = ops.multiply(v, ops.pow(rat(Number(b)), e));
      steps.push([shown + " = " + fmt(v), t("rCalc")]);
      return { answer: shown + " = " + fmtFull(v), steps };
    }
    if (!steps.length) return null;
    return { answer: shown, steps };
  }

  // ---------- distributive law ----------
  function topTerms(node, sign, out) {
    node = unparen(node);
    if (node.type === "OperatorNode" && node.fn === "add") { topTerms(node.args[0], sign, out); topTerms(node.args[1], sign, out); }
    else if (node.type === "OperatorNode" && node.fn === "subtract") { topTerms(node.args[0], sign, out); topTerms(node.args[1], -sign, out); }
    else if (node.type === "OperatorNode" && node.fn === "unaryMinus") topTerms(node.args[0], -sign, out);
    else out.push({ node, sign });
  }
  let SQUARE = false;
  function factorList(node, out) {
    node = unparen(node);
    if (node.type === "OperatorNode" && node.fn === "pow" && isSum(node.args[0])) {
      const e = constOf(node.args[1]);
      if (Number.isInteger(e) && e >= 2 && e <= 4) { if (e === 2) SQUARE = true; for (let i = 0; i < e; i++) out.push(unparen(node.args[0])); return; }
    }
    if (node.type === "OperatorNode" && node.fn === "multiply") { factorList(node.args[0], out); factorList(node.args[1], out); }
    else out.push(node);
  }
  const isSum = n => { n = unparen(n); return n.type === "OperatorNode" && (n.fn === "add" || n.fn === "subtract"); };
  function joinSigned(pieces) {
    return pieces.map((p, i) => {
      let s = p.s, sg = p.sign;
      if (s.startsWith("-")) { sg = -sg; s = s.slice(1).trim(); }
      if (/[+\-]/.test(s.replace(/^\(|\)$/g, ""))) s = "(" + s + ")";
      return i === 0 ? (sg < 0 ? "-" : "") + s : (sg < 0 ? " - " : " + ") + s;
    }).join("");
  }
  // polynomial in several letters as {"a^2*b": coef}
  function polyOf(node) {
    node = unparen(node);
    const add = (P, Q, k) => { const R = Object.assign({}, P); for (const m in Q) { R[m] = (R[m] || 0) + k * Q[m]; if (Math.abs(R[m]) < 1e-12) delete R[m]; } return R; };
    const mulMono = (a, b) => { const pw = {}; for (const m of [a, b]) if (m) m.split("*").forEach(f => { const [v, e] = f.split("^"); pw[v] = (pw[v] || 0) + (+e || 1); }); return Object.keys(pw).sort().map(v => pw[v] === 1 ? v : v + "^" + pw[v]).join("*"); };
    const mul = (P, Q) => { let R = {}; for (const a in P) for (const b in Q) R = add(R, { [mulMono(a, b)]: P[a] * Q[b] }, 1); return R; };
    switch (node.type) {
      case "ConstantNode": if (typeof node.value !== "number") throw 0; return node.value ? { "": node.value } : {};
      case "SymbolNode": if (KNOWN.has(node.name)) throw 0; return { [node.name]: 1 };
      case "OperatorNode": {
        const [a, b] = node.args;
        if (node.fn === "unaryMinus") return add({}, polyOf(a), -1);
        if (node.fn === "unaryPlus") return polyOf(a);
        if (node.fn === "add") return add(polyOf(a), polyOf(b), 1);
        if (node.fn === "subtract") return add(polyOf(a), polyOf(b), -1);
        if (node.fn === "multiply") return mul(polyOf(a), polyOf(b));
        if (node.fn === "divide") { const d = polyOf(b), ks = Object.keys(d); if (ks.length !== 1 || ks[0] !== "") throw 0; return add({}, polyOf(a), 1 / d[""]); }
        if (node.fn === "pow") { const e = constOf(b); if (!(Number.isInteger(e) && e >= 0 && e <= 12)) throw 0; let R = { "": 1 }; const P = polyOf(a); for (let i = 0; i < e; i++) R = mul(R, P); return R; }
      }
    }
    throw 0;
  }
  function polyStr(P) {
    const pw = m => { const o = {}; if (m) m.split("*").forEach(f => { const [v, e] = f.split("^"); o[v] = +e || 1; }); return o; };
    const deg = m => Object.values(pw(m)).reduce((t, e) => t + e, 0);
    const letters = [...new Set(Object.keys(P).flatMap(m => Object.keys(pw(m))))].sort();
    const keys = Object.keys(P).sort((x, y) => { if (deg(y) !== deg(x)) return deg(y) - deg(x); const a = pw(x), b = pw(y); for (const v of letters) if ((a[v] || 0) !== (b[v] || 0)) return (b[v] || 0) - (a[v] || 0); return 0; });
    if (!keys.length) return "0";
    return keys.map((m, i) => {
      const c = approxRat(P[m]), neg_ = val(c) < 0, ac = abs(c), cs = fmt(ac).replace("−", "");
      const body = m === "" ? cs : ac.exact && ac.d !== 1 ? (ac.n === 1 ? "" : ac.n + "*") + m + "/" + ac.d : (isInt(ac) && ac.n === 1 ? "" : cs + "*") + m;
      return (i === 0 ? (neg_ ? "-" : "") : neg_ ? " - " : " + ") + body;
    }).join("");
  }
  function simplifyStr(str) {
    try { const node = M().parse(str); if (symbols(node).length >= 1) return polyStr(polyOf(node)); } catch (e) { /* not a polynomial */ }
    try { return M().rationalize(str).toString(); } catch (e) { return M().simplify(str).toString(); }
  }
  // Returns steps to simplify one expression (expand brackets, then combine like terms)
  function simplifySteps(str, prefix) {
    prefix = prefix || "";
    const terms = [];
    topTerms(M().parse(str), 1, terms);
    let used = false, extended = false, minusFront = false;
    SQUARE = false;
    const pieces = [];
    for (const tm of terms) {
      const fs = []; factorList(tm.node, fs);
      const sums = fs.filter(isSum), others = fs.filter(f => !isSum(f));
      if (!sums.length) { pieces.push({ sign: tm.sign, s: simplifyStr(tm.node.toString()) }); continue; }
      used = true; if (sums.length >= 2) extended = true; if (tm.sign < 0) minusFront = true;
      let combos = [{ sign: tm.sign, parts: others.map(o => "(" + o.toString() + ")") }];
      for (const s of sums) {
        const st = []; topTerms(s, 1, st);
        combos = combos.flatMap(c => st.map(x => ({ sign: c.sign * x.sign, parts: c.parts.concat("(" + x.node.toString() + ")") })));
      }
      for (const c of combos) pieces.push({ sign: c.sign, s: (() => { const x = c.parts.join("*") || "1"; try { return simplifyStr(x); } catch (e) { return M().simplify(x).toString(); } })() });
    }
    const orig = pretty(str);
    const combined = pretty(simplifyStr(str));
    const steps = [];
    let last = orig;
    if (used) {
      const expanded = pretty(joinSigned(pieces));
      steps.push([orig + " = " + expanded, prefix + (SQUARE ? t("rSquare") : extended ? t("rExtDist") : t("rDist")) + (minusFront ? t("rMinus") : "")]);
      last = expanded;
    }
    const nTerms = x => { const o = []; topTerms(M().parse(x), 1, o); return o.length; };
    let fewer = true;
    if (!used) { try { fewer = nTerms(simplifyStr(str)) < terms.length; } catch (e) { fewer = false; } }
    if (fewer && combined.replace(/\s/g, "") !== last.replace(/\s/g, "")) steps.push([(used ? "= " : orig + " = ") + combined, prefix + t("rCombine")]);
    return { steps, result: combined };
  }

  // ---------- equations ----------
  function symbols(node) {
    const s = new Set();
    node.traverse((n, path, parent) => {
      if (n.type === "SymbolNode" && !KNOWN.has(n.name) && !(parent && parent.type === "FunctionNode" && path === "fn")) s.add(n.name);
    });
    return [...s];
  }
  function evalAt(code, v, x) {
    const r = code.evaluate(Object.assign({}, SCOPE, { [v]: x }));
    if (typeof r !== "number" || !isFinite(r)) throw new Error("not a number");
    return r;
  }
  const close = (a, b) => Math.abs(a - b) <= 1e-7 * (1 + Math.abs(b));
  function linCoef(code, v) {
    try {
      const q = evalAt(code, v, 0), p = evalAt(code, v, 1) - q;
      for (const x of [2, -3, 0.5, 7]) if (!close(evalAt(code, v, x), p * x + q)) return null;
      return { p: approxRat(p), q: approxRat(q) };
    } catch (e) { return null; }
  }
  function quadCoef(f) {
    try {
      const c = f(0), f1 = f(1), fm = f(-1);
      const a = (f1 + fm) / 2 - c, b = (f1 - fm) / 2;
      for (const x of [2, -3, 0.5, 5]) if (!close(f(x), a * x * x + b * x + c)) return null;
      return { a: approxRat(a), b: approxRat(b), c: approxRat(c) };
    } catch (e) { return null; }
  }
  function term(k, v) {
    if (isInt(k) && k.n === 1) return v;
    if (isInt(k) && k.n === -1) return "−" + v;
    if (k.exact && k.d !== 1) return "(" + fmt(k) + ")" + v;
    return fmt(k) + v;
  }
  function combo(parts) {
    const out = [];
    for (const [k, v] of parts) {
      if (val(k) === 0) continue;
      if (!out.length) out.push(v ? term(k, v) : fmt(k));
      else out.push((val(k) < 0 ? " − " : " + ") + (v ? term(abs(k), v) : fmt(abs(k))));
    }
    return out.length ? out.join("") : "0";
  }

  function solveLinear(L, R, v, steps, check) {
    const a = ops.subtract(L.p, R.p);
    if (val(a) === 0) {
      const same = val(ops.subtract(L.q, R.q)) === 0;
      steps.push([combo([[L.q, ""]]) + " = " + combo([[R.q, ""]]), same ? t("alwaysEqual") : t("cancel", v)]);
      return { answer: same ? t("everyValue", v) : t("noSolution"), steps };
    }
    let c = R.q;
    if (val(R.p) !== 0) steps.push([combo([[a, v], [L.q, ""]]) + " = " + fmt(c), val(R.p) > 0 ? t("subFrom", iso(term(R.p, v))) : t("addTo", iso(term(abs(R.p), v)))]);
    if (val(L.q) !== 0) {
      c = ops.subtract(c, L.q);
      steps.push([term(a, v) + " = " + fmt(c), val(L.q) > 0 ? t("subFrom", iso(fmt(L.q))) : t("addTo", iso(fmt(abs(L.q))))]);
    }
    const x = ops.divide(c, a);
    if (a.exact && a.d !== 1) {
      const rcp = ops.divide(rat(1), a);
      steps.push([v + " = " + paren(c) + " × " + paren(rcp) + " = " + fmt(x), t("multiply", iso(paren(rcp)))]);
    } else if (!(isInt(a) && a.n === 1)) steps.push([v + " = " + fmt(c) + " ÷ " + paren(a) + " = " + fmt(x), t("divide", iso(paren(a)))]);
    if (check) {
      try { const [lv, rv] = check(val(x)); if (close(lv, rv)) steps.push([v + " = " + fmt(x) + ":   " + round(lv) + " = " + round(rv) + " ✓", t("check")]); } catch (e) { /* skip */ }
    }
    return { answer: iso(v + " = " + fmtFull(x)), steps };
  }

  function solveQuad(Q, v, steps) {
    const { a, b, c } = Q;
    steps.push([combo([[a, v + "²"], [b, v], [c, ""]]) + " = 0", t("oneSide")]);
    steps.push(["a = " + fmt(a) + ",  b = " + fmt(b) + ",  c = " + fmt(c), t("coefs")]);
    const D = ops.subtract(ops.multiply(b, b), ops.multiply(rat(4), ops.multiply(a, c)));
    steps.push(["D = b² − 4ac = " + paren(b) + "² − 4 × " + paren(a) + " × " + paren(c) + " = " + fmt(D), t("disc")]);
    if (val(D) < 0) { steps.push(["D < 0", t("discNeg")]); return { answer: t("noReal"), steps }; }
    const twoA = ops.multiply(rat(2), a), mb = neg(b);
    if (val(D) === 0) {
      const x = ops.divide(mb, twoA);
      steps.push([v + " = −b ÷ 2a = " + fmt(mb) + " ÷ " + paren(twoA) + " = " + fmt(x), t("discZero")]);
      return { answer: iso(v + " = " + fmtFull(x)), steps };
    }
    const sq = fns.sqrt(D);
    steps.push([v + " = (−b ± √D) ÷ 2a = (" + fmt(mb) + " ± √" + fmt(D) + ") ÷ " + paren(twoA) + (sq.exact ? "  ,  √" + fmt(D) + " = " + fmt(sq) : ""), t("quadFormula")]);
    const x1 = ops.divide(ops.add(mb, sq), twoA), x2 = ops.divide(ops.subtract(mb, sq), twoA);
    steps.push([v + "₁ = (" + fmt(mb) + " + " + fmt(sq) + ") ÷ " + paren(twoA) + " = " + fmtShort(x1), ""]);
    steps.push([v + "₂ = (" + fmt(mb) + " − " + fmt(sq) + ") ÷ " + paren(twoA) + " = " + fmtShort(x2), ""]);
    return { answer: iso(v + " = " + fmtShort(x1)) + t("or") + iso(v + " = " + fmtShort(x2)), steps };
  }

  function solveNumeric(f, v, steps) {
    const roots = [];
    const add = r => { if (!roots.some(x => Math.abs(x - r) < 1e-6)) roots.push(r); };
    let px = -100, py = safe(f, px);
    for (let x = -100 + 0.25; x <= 100 && roots.length < 6; x += 0.25) {
      const y = safe(f, x);
      if (y !== null && Math.abs(y) < 1e-12) add(x);
      else if (y !== null && py !== null && py * y < 0) {
        let lo = px, hi = x, flo = py;
        for (let i = 0; i < 80; i++) { const m = (lo + hi) / 2, fm = safe(f, m); if (fm === null) break; if (flo * fm <= 0) hi = m; else { lo = m; flo = fm; } }
        const r = (lo + hi) / 2, fr = safe(f, r);
        if (fr !== null && Math.abs(fr) < 1e-6) add(Math.round(r * 1e8) / 1e8);
      }
      px = x; py = y;
    }
    if (!roots.length) fail(t("noFound"));
    const ans = roots.map(r => v + " " + fmtShort(approxRat(r)).replace(/^(?!≈)/, "= "));
    steps.push([ans.join(" , "), t("numeric", v)]);
    return { answer: ans.map(iso).join(t("or")), steps };
  }
  function safe(f, x) { try { const y = f(x); return typeof y === "number" && isFinite(y) ? y : null; } catch (e) { return null; } }

  function equation(ls, rs) {
    const lhs = M().parse(ls), rhs = M().parse(rs);
    const vars = [...new Set([...symbols(lhs), ...symbols(rhs)])];
    if (vars.length === 0) {
      const a = arithmetic(ls), b = arithmetic(rs);
      const ok = close(val(a.value), val(b.value));
      a.steps.push([fmt(a.value) + (ok ? " = " : " ≠ ") + fmt(b.value), ok ? t("matches", iso(fmt(b.value))) : t("mismatch", iso(fmt(b.value)), iso(fmt(a.value)))]);
      return { answer: a.answer, steps: a.steps };
    }
    if (vars.length > 1) {
      if (vars.length === 2 && vars.includes("x") && vars.includes("y")) { const r = xyEquation(ls, rs); if (r) return r; }
      fail(t("multiVars", iso(vars.join(", "))));
    }
    const v = vars[0], cl = lhs.compile(), cr = rhs.compile();
    if (hasTrig(lhs, v) || hasTrig(rhs, v)) { const r = trigEquation(lhs, rhs, v); if (r) return r; }
    const ex = expEquation(lhs, rhs, v); if (ex) return ex;
    const lg = logEquation(lhs, rhs, v); if (lg) return lg;
    try { const fr = lcdEquation(ls, rs, lhs, rhs, v); if (fr) return fr; } catch (e) { /* the usual way */ }
    try { const ra = rationalEquation(ls, rs, lhs, rhs, v); if (ra) return ra; } catch (e) { /* the usual way */ }
    const steps = [];
    // simplify each side first (brackets, like terms)
    let sl = { steps: [] }, sr = { steps: [] };
    try { sl = simplifySteps(ls, t("left")); } catch (e) { /* leave as is */ }
    try { sr = simplifySteps(rs, t("right")); } catch (e) { /* leave as is */ }
    steps.push(...sl.steps, ...sr.steps);
    if (sl.steps.length || sr.steps.length) steps.push([(sl.steps.length ? sl.result : pretty(ls)) + " = " + (sr.steps.length ? sr.result : pretty(rs)), t("simplified")]);
    const check = x => [evalAt(cl, v, x), evalAt(cr, v, x)];
    const L = linCoef(cl, v), R = linCoef(cr, v);
    if (L && R) return solveLinear(L, R, v, steps, check);
    const f = x => evalAt(cl, v, x) - evalAt(cr, v, x);
    const Q = quadCoef(f);
    if (Q && val(Q.a) === 0) {
      steps.push([combo([[Q.b, v], [Q.c, ""]]) + " = 0", t("x2cancel", v)]);
      return solveLinear({ p: Q.b, q: Q.c }, { p: rat(0), q: rat(0) }, v, steps, check);
    }
    if (Q) return solveQuad(Q, v, steps);
    return solveNumeric(f, v, steps);
  }

  // ---------- algebra ----------
  function algebra(expr) {
    try { const fa = fracAlgebra(expr); if (fa) return fa; } catch (e) { /* the usual way */ }
    const p = powers(expr);
    if (p) return p;
    const r = simplifySteps(expr);
    if (!r.steps.length) return { answer: pretty(expr), steps: [[pretty(expr), t("already")]] };
    return { answer: r.result, steps: r.steps };
  }

  // =====================================================================
  //  Grades 10–12: inequalities, systems, exponents & logs, trig equations,
  //  calculus, sequences, analytic geometry, combinatorics, statistics
  // =====================================================================
  const NUM = x => fmt(approxRat(x));
  const NS = x => fmtShort(approxRat(x));
  const SUBM = "₀₁₂₃₄₅₆₇₈₉";
  const subs = n => String(n).replace(/\d/g, c => SUBM[+c]).replace(/-/g, "₋");
  const deg = x => NUM(x) + "°";
  function NUMP(x) {
    if (approxRat(x).exact) return NUM(x);
    const k = approxRat(x / Math.PI);
    if (k.exact && k.d <= 12) return (isInt(k) ? (k.n === 1 ? "" : k.n === -1 ? "−" : fmt(k)) + "π" : (k.n === 1 ? "" : k.n === -1 ? "−" : fmt(rat(k.n))) + "π/" + k.d);
    return round(x);
  }
  function surd(n) {                                   // √n as k√m (n a whole number)
    if (!Number.isInteger(n) || n < 0) return null;
    let k = 1, m = n;
    for (let f = 2; f * f <= m; f++) while (m % (f * f) === 0) { m /= f * f; k *= f; }
    return m === 1 ? String(k) : (k === 1 ? "" : k) + "√" + m;
  }
  function rootStr(sq) {                               // √sq shown nicely
    const r = approxRat(sq);
    if (isInt(r) && r.n >= 0) { const s = surd(r.n); return s.includes("√") ? s + " ≈ " + round(Math.sqrt(r.n)) : s; }
    return "√" + NUM(sq) + " ≈ " + round(Math.sqrt(sq));
  }
  const P = node => pretty(typeof node === "string" ? node : node.toString())
    .replace(/(\d+)\/(\d+)\/(√\([^()]*\)|√\w+)/g, "$1/($2$3)")
    .replace(/^−\((\d+\/\([^()]*\)[²³⁴⁵]?)\)$/, "−$1");
  const cleanRoot = r => { const q = approxRat(r); return q.exact ? val(q) : Math.round(r * 1e9) / 1e9; };
  function compileF(str, v, scope) {
    const code = M().parse(str).compile();
    return x => { const r = code.evaluate(Object.assign({}, SCOPE, scope || {}, { [v]: x })); if (typeof r !== "number" || !isFinite(r)) throw new Error("nan"); return r; };
  }
  function scanRoots(f, lo, hi, step) {
    const roots = [], breaks = [];
    const add = (arr, r) => { if (!arr.some(x => Math.abs(x - r) < 1e-6)) arr.push(r); };
    let lx = null, ly = null;
    const n = Math.round((hi - lo) / step);
    for (let i = 0; i <= n; i++) {
      const x = lo + i * step, y = safe(f, x);
      if (y === null) continue;
      if (Math.abs(y) < 1e-12) add(roots, cleanRoot(x));
      else if (ly !== null && Math.abs(ly) >= 1e-12 && ly * y < 0) {
        let a = lx, b = x, fa = ly, hole = null;
        for (let k = 0; k < 90; k++) {
          const m = (a + b) / 2, fm = safe(f, m);
          if (fm === null) { hole = m; break; }
          if (fa * fm <= 0) b = m; else { a = m; fa = fm; }
        }
        const r = hole !== null ? hole : (a + b) / 2, fr = hole !== null ? null : safe(f, r);
        if (fr !== null && Math.abs(fr) < 1e-6 * (1 + Math.abs(ly) + Math.abs(y))) add(roots, cleanRoot(r)); else add(breaks, cleanRoot(r));
      }
      lx = x; ly = y;
    }
    return { roots: roots.sort((a, b) => a - b), breaks: breaks.sort((a, b) => a - b) };
  }
  function quadRoots(Q) {
    const a = val(Q.a), b = val(Q.b), c = val(Q.c);
    if (a === 0) return b === 0 ? [] : [-c / b];
    const D = b * b - 4 * a * c;
    if (D < -1e-12) return [];
    if (Math.abs(D) < 1e-12) return [-b / (2 * a)];
    const s = Math.sqrt(D);
    return [(-b - s) / (2 * a), (-b + s) / (2 * a)].sort((x, y) => x - y);
  }
  // exact roots when possible (line / parabola), otherwise a numeric scan
  function rootsOf(f, lo, hi) {
    const Q = quadCoef(f);
    if (Q && (val(Q.a) !== 0 || val(Q.b) !== 0)) return quadRoots(Q).map(cleanRoot);
    if (Q) return [];
    return scanRoots(f, lo, hi, (hi - lo) / 4000).roots;
  }

  // ---------- inequalities ----------
  const REL = { "<": "<", "<=": "≤", ">": ">", ">=": "≥" };
  const FLIP = { "<": ">", "<=": ">=", ">": "<", ">=": "<=" };
  function cmp(a, op, b) { return op === "<" ? a < b : op === "<=" ? a <= b + 1e-12 : op === ">" ? a > b : a >= b - 1e-12; }
  function intervals(f, pts, roots, v, op) {
    const strict = op === "<" || op === ">";
    const want = y => (op[0] === "<" ? y < 0 : y > 0);
    const k = pts.length, el = [];
    const test = i => { const x = k === 0 ? 0 : i === 0 ? pts[0] - 1 : i === k ? pts[k - 1] + 1 : (pts[i - 1] + pts[i]) / 2; return safe(f, x); };
    const signs = [];
    for (let i = 0; i <= k; i++) {
      const y = test(i); signs.push(y === null ? "∅" : y > 0 ? "+" : "−");
      el.push(y !== null && want(y));
      if (i < k) el.push(!strict && roots.some(r => Math.abs(r - pts[i]) < 1e-9));
    }
    const runs = [];
    for (let i = 0; i < el.length; i++) if (el[i]) { let j = i; while (j + 1 < el.length && el[j + 1]) j++; runs.push([i, j]); i = j; }
    const parts = runs.map(([s, e]) => {
      const lo = s % 2 === 0 ? (s === 0 ? null : { x: pts[s / 2 - 1], c: false }) : { x: pts[(s - 1) / 2], c: true };
      const hi = e % 2 === 0 ? (e / 2 === k ? null : { x: pts[e / 2], c: false }) : { x: pts[(e - 1) / 2], c: true };
      if (!lo && !hi) return "ALL";
      if (lo && hi && lo.x === hi.x) return v + " = " + NS(lo.x);
      if (!lo) return v + (hi.c ? " ≤ " : " < ") + NS(hi.x);
      if (!hi) return v + (lo.c ? " ≥ " : " > ") + NS(lo.x);
      return NS(lo.x) + (lo.c ? " ≤ " : " < ") + v + (hi.c ? " ≤ " : " < ") + NS(hi.x);
    });
    const ranges = [];
    for (let i = 0; i <= k; i++) {
      const r = k === 0 ? t("everyValue", v).replace(/^\S+\s/, "") : i === 0 ? v + " < " + NS(pts[0]) : i === k ? v + " > " + NS(pts[k - 1]) : NS(pts[i - 1]) + " < " + v + " < " + NS(pts[i]);
      ranges.push((k === 0 ? "" : r + ":  ") + signs[i]);
    }
    let answer;
    if (parts.includes("ALL")) answer = t("everyValue", v);
    else if (!parts.length) answer = t("noSolution");
    else answer = parts.map(iso).join(t("or"));
    return { answer, table: ranges.join("   |   ") };
  }
  function inequality(s) {
    const parts = s.split(/(<=|>=|<|>)/).map(x => x.trim());
    if (parts.length === 5) return doubleIneq(parts);
    if (parts.length !== 3 || !parts[0] || !parts[2]) fail(t("ineqForm"));
    const [ls, op, rs] = parts;
    const lhs = M().parse(ls), rhs = M().parse(rs);
    const vars = [...new Set([...symbols(lhs), ...symbols(rhs)])];
    if (!vars.length) {
      const a = arithmetic(ls).value, b = arithmetic(rs).value, ok = cmp(val(a), op, val(b));
      return { answer: ok ? t("trueW") : t("falseW"), steps: [[fmt(a) + " " + REL[op] + " " + fmt(b), ok ? t("isTrue") : t("isFalse")]] };
    }
    if (vars.length > 1) fail(t("multiVars", iso(vars.join(", "))));
    const v = vars[0], cl = lhs.compile(), cr = rhs.compile(), steps = [];
    const L = linCoef(cl, v), R = linCoef(cr, v);
    if (L && R) {
      const a = ops.subtract(L.p, R.p), c = ops.subtract(R.q, L.q);
      steps.push([combo([[a, v]]) + " " + REL[op] + " " + fmt(c), t("ineqMove")]);
      if (val(a) === 0) { const ok = cmp(0, op, val(c)); return { answer: ok ? t("everyValue", v) : t("noSolution"), steps }; }
      const x = ops.divide(c, a);
      let op2 = op;
      if (val(a) < 0) { op2 = FLIP[op]; steps.push([v + " " + REL[op2] + " " + fmt(c) + " ÷ " + paren(a), t("ineqFlip", iso(paren(a)))]); }
      else if (!(isInt(a) && a.n === 1)) steps.push([v + " " + REL[op2] + " " + fmt(c) + " ÷ " + paren(a), t("divide", iso(paren(a)))]);
      const ans = v + " " + REL[op2] + " " + fmtShort(x);
      steps.push([ans, t("ineqAns")]);
      return { answer: iso(ans), steps };
    }
    const f = x => evalAt(cl, v, x) - evalAt(cr, v, x);
    const Q = quadCoef(f);
    let roots, breaks = [];
    if (Q && val(Q.a) !== 0) {
      const poly = combo([[Q.a, v + "²"], [Q.b, v], [Q.c, ""]]);
      steps.push([poly + " " + REL[op] + " 0", t("oneSide")]);
      roots = quadRoots(Q).map(cleanRoot);
      steps.push([roots.length ? roots.map((r, i) => v + (roots.length > 1 ? subs(i + 1) : "") + " = " + NS(r)).join("  ,  ") : "D < 0",
        roots.length ? t("ineqRoots", iso(poly + " = 0")) : t("ineqNoRoots")]);
      steps.push([val(Q.a) > 0 ? "a = " + fmt(Q.a) + " > 0   ∪" : "a = " + fmt(Q.a) + " < 0   ∩", val(Q.a) > 0 ? t("parUp") : t("parDown")]);
    } else {
      let one = ls + "-(" + rs + ")"; try { one = simplifyStr(one); } catch (e) { /* keep */ }
      steps.push([P(one) + " " + REL[op] + " 0", t("oneSide")]);
      const sc = scanRoots(f, -100, 100, 0.05); roots = sc.roots; breaks = sc.breaks;
      if (roots.length) steps.push([roots.map(r => v + " = " + NS(r)).join("  ,  "), t("ineqZeros")]);
      else steps.push(["≠ 0", t("ineqNoRoots")]);
      if (breaks.length) steps.push([breaks.map(b => v + " ≠ " + NS(b)).join("  ,  "), t("ineqBreaks")]);
    }
    const pts = [...new Set(roots.concat(breaks))].sort((a, b) => a - b);
    const res = intervals(f, pts, roots, v, op);
    steps.push([res.table, t("ineqSigns")]);
    return { answer: res.answer, steps };
  }
  function doubleIneq([A, op1, B, op2, C]) {
    const node = M().parse(B), vars = symbols(node);
    if (vars.length !== 1 || symbols(M().parse(A)).length || symbols(M().parse(C)).length) fail(t("ineqForm"));
    const v = vars[0], Lc = linCoef(node.compile(), v);
    if (!Lc || val(Lc.p) === 0) fail(t("ineqForm"));
    let lo = arithmetic(A).value, hi = arithmetic(C).value, o1 = op1, o2 = op2;
    const steps = [];
    if (val(Lc.q) !== 0) {
      lo = ops.subtract(lo, Lc.q); hi = ops.subtract(hi, Lc.q);
      steps.push([fmt(lo) + " " + REL[o1] + " " + term(Lc.p, v) + " " + REL[o2] + " " + fmt(hi), val(Lc.q) > 0 ? t("subFrom", iso(fmt(Lc.q))) : t("addTo", iso(fmt(abs(Lc.q))))]);
    }
    if (!(isInt(Lc.p) && Lc.p.n === 1)) {
      lo = ops.divide(lo, Lc.p); hi = ops.divide(hi, Lc.p);
      if (val(Lc.p) < 0) { [lo, hi] = [hi, lo]; [o1, o2] = [FLIP[o2], FLIP[o1]]; }
      steps.push([fmt(lo) + " " + REL[o1] + " " + v + " " + REL[o2] + " " + fmt(hi), val(Lc.p) < 0 ? t("ineqFlip", iso(paren(Lc.p))) : t("divide", iso(paren(Lc.p)))]);
    }
    if (o1[0] === ">") { [lo, hi] = [hi, lo]; [o1, o2] = [FLIP[o2], FLIP[o1]]; }
    const ans = fmtShort(lo) + " " + REL[o1] + " " + v + " " + REL[o2] + " " + fmtShort(hi);
    if (!cmp(val(lo), o1, val(hi)) && !(o1 === "<=" && o2 === "<=" && val(lo) === val(hi))) return { answer: t("noSolution"), steps };
    steps.push([ans, t("ineqAns")]);
    return { answer: iso(ans), steps };
  }

  // ---------- two equations, two unknowns ----------
  function linear2(eq, vars) {
    const [ls, rs] = eq.split("=");
    const code = M().parse("(" + ls + ")-(" + rs + ")").compile();
    const F = (x, y) => { const r = code.evaluate(Object.assign({}, SCOPE, { [vars[0]]: x, [vars[1]]: y })); if (typeof r !== "number" || !isFinite(r)) throw new Error("nan"); return r; };
    try {
      const k = F(0, 0), a = F(1, 0) - k, b = F(0, 1) - k;
      for (const [x, y] of [[2, 3], [-1, 5], [0.5, -2], [7, -4]]) if (!close(F(x, y), a * x + b * y + k)) return null;
      return { a: approxRat(a), b: approxRat(b), c: approxRat(-k) };
    } catch (e) { return null; }
  }
  function system(lines) {
    let vars;
    try { vars = [...new Set(lines.flatMap(l => l.split("=").flatMap(p => symbols(M().parse(p)))))].sort(); } catch (e) { return null; }
    if (vars.length !== 2) return null;
    const E = lines.map(l => linear2(l, vars));
    if (E.some(e => !e || (val(e.a) === 0 && val(e.b) === 0))) return null;
    const [x, y] = vars, steps = [];
    const show = e => combo([[e.a, x], [e.b, y]]) + " = " + fmt(e.c);
    E.forEach((e, i) => steps.push(["(" + (i + 1) + ")   " + show(e), t("sysArrange", i + 1)]));
    const [e1, e2] = E, m = ops.multiply;
    const det = ops.subtract(m(e1.a, e2.b), m(e2.a, e1.b));
    if (val(det) === 0) {
      const same = val(ops.subtract(m(e1.a, e2.c), m(e2.a, e1.c))) === 0 && val(ops.subtract(m(e1.b, e2.c), m(e2.b, e1.c))) === 0;
      steps.push([same ? "(1) ≡ (2)" : "(1) ∥ (2)", same ? t("sysInf") : t("sysNone")]);
      return { answer: same ? t("sysInfAns") : t("noSolution"), steps };
    }
    const unit = k => isInt(k) && Math.abs(k.n) === 1;
    let pick = null;
    for (const [i, e] of [[0, e1], [1, e2]]) {
      if (unit(e.b)) { pick = { i, iso: y, other: x, k: e.b, ko: e.a }; break; }
      if (unit(e.a)) { pick = { i, iso: x, other: y, k: e.a, ko: e.b }; break; }
    }
    let X, Y;
    if (pick) {
      const e = E[pick.i], o = E[1 - pick.i], oi = 2 - pick.i;
      const c0 = ops.divide(e.c, pick.k), c1 = neg(ops.divide(pick.ko, pick.k));       // iso = c0 + c1·other
      const exprS = combo([[c0, ""], [c1, pick.other]]);
      steps.push([pick.iso + " = " + exprS, t("sysIsolate", pick.iso, pick.i + 1)]);
      const kIso = pick.iso === y ? o.b : o.a, kOther = pick.iso === y ? o.a : o.b;
      const sub = (pick.iso === y ? term(o.a, x) : term(o.b, y)) + (val(kIso) < 0 ? " − " : " + ") + (isInt(kIso) && Math.abs(kIso.n) === 1 ? "" : fmt(abs(kIso))) + "(" + exprS + ") = " + fmt(o.c);
      steps.push([pick.iso === y ? sub : sub, t("sysSub", oi)]);
      const A = ops.add(kOther, m(kIso, c1)), B = m(kIso, c0);
      steps.push([combo([[A, pick.other], [B, ""]]) + " = " + fmt(o.c), t("rCombine")]);
      const r = solveLinear({ p: A, q: B }, { p: rat(0), q: o.c }, pick.other, steps, null);
      if (val(A) === 0) return r;
      const ov = ops.divide(ops.subtract(o.c, B), A);
      const iv = ops.add(c0, m(c1, ov));
      steps.push([pick.iso + " = " + exprS.split(pick.other).join(paren(ov)) + " = " + fmt(iv), t("sysBack", pick.iso)]);
      if (pick.iso === y) { X = ov; Y = iv; } else { X = iv; Y = ov; }
    } else {
      // elimination: make the y coefficients opposite
      const k1 = abs(e2.b), k2 = abs(e1.b);
      const add = val(e1.b) * val(e2.b) < 0;
      const n1 = { a: m(e1.a, k1), b: m(e1.b, k1), c: m(e1.c, k1) }, n2 = { a: m(e2.a, k2), b: m(e2.b, k2), c: m(e2.c, k2) };
      if (val(k1) !== 1) steps.push(["(1)   " + show(n1), t("sysMul", 1, iso(fmt(k1)))]);
      if (val(k2) !== 1) steps.push(["(2)   " + show(n2), t("sysMul", 2, iso(fmt(k2)))]);
      const A = add ? ops.add(n1.a, n2.a) : ops.subtract(n1.a, n2.a), C = add ? ops.add(n1.c, n2.c) : ops.subtract(n1.c, n2.c);
      steps.push([term(A, x) + " = " + fmt(C), t("sysElim", add, y)]);
      X = ops.divide(C, A);
      if (!(isInt(A) && A.n === 1)) steps.push([x + " = " + fmt(C) + " ÷ " + paren(A) + " = " + fmt(X), t("divide", iso(paren(A)))]);
      const e = val(e1.b) !== 0 ? e1 : e2;
      Y = ops.divide(ops.subtract(e.c, m(e.a, X)), e.b);
      steps.push([fmt(e.a) + "·" + paren(X) + " + " + paren(e.b) + y + " = " + fmt(e.c) + "   ⇒   " + y + " = " + fmt(Y), t("sysBack", y)]);
    }
    const chk = E.map(e => fmt(ops.add(m(e.a, X), m(e.b, Y))) + " = " + fmt(e.c) + " ✓").join("   ,   ");
    steps.push([chk, t("sysCheck")]);
    return { answer: iso(x + " = " + fmtShort(X)) + " ,  " + iso(y + " = " + fmtShort(Y)), steps };
  }

  // ---------- fractions with letters ----------
  const lcm = (a, b) => a / gcd(a, b) * b;
  function numDens(node) {                  // whole-number denominators in an expression
    const out = [];
    node.traverse(n => {
      if (n.type === "OperatorNode" && n.fn === "divide" && !symbols(n.args[1]).length) { const d = constOf(n.args[1]); if (d && Number.isInteger(d) && Math.abs(d) > 1) out.push(Math.abs(d)); }
    });
    return out;
  }
  function varDens(node, v) {
    const out = [];
    node.traverse(n => { if (n.type === "OperatorNode" && n.fn === "divide" && hasVar(n.args[1], v)) out.push(unparen(n.args[1])); });
    return out;
  }
  // multiply every term of a side by L:  (x+1)/2 · 6 → 3(x + 1)
  function timesL(str, L) {
    const terms = []; topTerms(M().parse(str), 1, terms);
    return terms.map((tm, i) => {
      let n = unparen(tm.node), body;
      if (n.type === "OperatorNode" && n.fn === "divide" && !symbols(n.args[1]).length) {
        const k = L / constOf(n.args[1]), a = unparen(n.args[0]).toString();
        body = k === 1 ? a : isSum(n.args[0]) ? k + "*(" + a + ")" : polyStr(polyOf(M().parse(k + "*(" + a + ")")));
      } else body = isSum(n) ? L + "*(" + n.toString() + ")" : polyStr(polyOf(M().parse(L + "*(" + n.toString() + ")")));
      if (tm.sign < 0 && body.startsWith("-")) return (i ? " + " : "") + body.slice(1);
      return (tm.sign < 0 ? " - " : i ? " + " : "") + body;
    }).join("");
  }
  function lcdEquation(ls, rs, lhs, rhs, v) {
    const dens = numDens(lhs).concat(numDens(rhs));
    if (!dens.length || varDens(lhs, v).length || varDens(rhs, v).length) return null;
    const cl = lhs.compile(), cr = rhs.compile();
    if (!linCoef(cl, v) || !linCoef(cr, v)) return null;
    const L = dens.reduce(lcm, 1);
    const nl = timesL(ls, L), nr = timesL(rs, L);
    const steps = [[pretty(nl) + " = " + pretty(nr), t("lcdMul", L)]];
    const r = equation(nl, nr);
    return { answer: r.answer, steps: steps.concat(r.steps) };
  }
  // polynomials in one letter as coefficient arrays (lowest power first)
  const ptrim = a => { a = a.slice(); while (a.length > 1 && Math.abs(a[a.length - 1]) < 1e-10) a.pop(); return a.length ? a : [0]; };
  function pcoefs(str) { const r = M().rationalize(str, {}, true); if (r.variables.length > 1) throw new Error("vars"); return ptrim((r.coefficients || [constOf(M().parse(str))]).map(Number)); }
  function pdiv(a, b) {
    a = ptrim(a); b = ptrim(b); const q = new Array(Math.max(1, a.length - b.length + 1)).fill(0); let r = a.slice();
    for (let guard = 0; guard < 60 && r.length >= b.length && !(r.length === 1 && Math.abs(r[0]) < 1e-10); guard++) {
      const k = r[r.length - 1] / b[b.length - 1], sh = r.length - b.length;
      q[sh] = k; for (let i = 0; i < b.length; i++) r[i + sh] -= k * b[i];
      r.pop(); r = ptrim(r); if (r.length < b.length) break;
    }
    return { q: ptrim(q), r };
  }
  function pgcd(a, b) {
    a = ptrim(a); b = ptrim(b);
    for (let i = 0; i < 20 && !(b.length === 1 && Math.abs(b[0]) < 1e-9); i++) { const r = pdiv(a, b).r.map(x => (Math.abs(x) < 1e-9 ? 0 : x)); a = b; b = ptrim(r); }
    const lead = a[a.length - 1]; return a.map(x => x / lead);
  }
  const pstr = (a, v) => { const P = {}; a.forEach((c, i) => { if (Math.abs(c) > 1e-12) P[i === 0 ? "" : i === 1 ? v : v + "^" + i] = val(approxRat(c)); }); return polyStr(P); };
  const wrapP = x => (/[+\-]/.test(x.replace(/^-/, "")) ? "(" + x + ")" : x);
  function rationalEquation(ls, rs, lhs, rhs, v) {
    const dens = varDens(lhs, v).concat(varDens(rhs, v));
    if (!dens.length) return null;
    const steps = [];
    let holes = [];
    for (const d of dens) { try { holes = holes.concat(rootsOf(compileF(d.toString(), v), -100, 100)); } catch (e) { /* skip */ } }
    holes = [...new Set(holes.map(cleanRoot))].sort((a, b) => a - b);
    if (holes.length) steps.push([holes.map(h => v + " ≠ " + NS(h)).join("  ,  "), t("ratDomain")]);
    let R;
    try { R = M().rationalize("(" + ls + ")-(" + rs + ")", {}, true); } catch (e) { return null; }
    if (!R.numerator || R.variables.length !== 1) return null;
    const numS = R.numerator.toString();
    steps.push([pretty(numS) + " = 0", t("ratMul")]);
    const r = equation(numS, "0");
    steps.push(...r.steps.filter(x => x[1] !== t("check")));
    const xs = [...String(r.answer).replace(/[⁦-⁩]/g, "").matchAll(new RegExp(v + "\\s*[=≈]\\s*(−?[\\d./]+)", "g"))].map(m => { try { return M().evaluate(m[1].replace("−", "-")); } catch (e) { return null; } }).filter(x => x !== null);
    if (!xs.length) return { answer: r.answer, steps };
    const good = xs.filter(x => !holes.some(h => close(h, x))), bad = xs.filter(x => holes.some(h => close(h, x)));
    bad.forEach(x => steps.push([v + " = " + NS(x), t("ratBad", iso(v + " = " + NS(x)))]));
    if (good.length) steps.push([good.map(x => v + " = " + NS(x)).join("  ,  "), t("ratOk")]);
    return { answer: good.length ? good.map(x => iso(v + " = " + NS(x))).join(t("or")) : t("noSolution"), steps };
  }
  // simplifying an algebraic fraction: (x² − 1)/(x − 1) = x + 1, 1/x + 1/(x+1) = (2x + 1)/(x² + x)
  function fracAlgebra(expr) {
    const node = M().parse(expr), vars = symbols(node);
    let hasDen = false;
    node.traverse(n => { if (n.type === "OperatorNode" && n.fn === "divide" && symbols(n.args[1]).length) hasDen = true; });
    if (!hasDen) return null;
    const steps = [], orig = pretty(expr);
    const R = M().rationalize(expr, {}, true);
    let numS = R.numerator.toString(), denS = R.denominator ? R.denominator.toString() : "1";
    const terms = []; topTerms(node, 1, terms);
    if (terms.length > 1) steps.push([orig + " = " + wrapP(pretty(simplifyStr(numS))) + "/" + wrapP(pretty(simplifyStr(denS))), t("fracCommon")]);
    if (vars.length === 1) {
      const v = vars[0], N = pcoefs(numS), D = pcoefs(denS), G = pgcd(N, D);
      if (G.length > 1) {
        const q1 = pdiv(N, G).q, q2 = pdiv(D, G).q, g = pstr(G, v);
        const part = q => (q.length === 1 && Math.abs(q[0] - 1) < 1e-12 ? "" : "·" + wrapP(pretty(pstr(q, v))));
        const grp = q => (part(q) ? "((" + pretty(g) + ")" + part(q) + ")" : "(" + pretty(g) + ")");
        steps.push([grp(q1) + "/" + grp(q2), t("fracFactor")]);
        const den1 = q2.length === 1 ? q2[0] : null;
        const res = den1 !== null ? pstr(q1.map(c => c / den1), v) : wrapP(pstr(q1, v)) + "/" + wrapP(pstr(q2, v));
        const zs = rootsOf(compileF(g, v), -100, 100);
        steps.push(["= " + pretty(res) + (zs.length ? "   (" + zs.map(z => v + " ≠ " + NS(z)).join(", ") + ")" : ""), t("fracCancel", iso(pretty(g)))]);
        return { answer: pretty(res), steps };
      }
      const res = wrapP(pstr(N, v)) + "/" + wrapP(pstr(D, v));
      if (!steps.length) steps.push([orig, t("already")]);
      return { answer: pretty(res), steps };
    }
    // several letters: cancel a common letter or number from every term
    try {
      const Np = polyOf(M().parse(numS)), Dp = polyOf(M().parse(denS));
      const mons = Object.keys(Np).concat(Object.keys(Dp));
      const pw = m => { const o = {}; if (m) m.split("*").forEach(f => { const [x, e] = f.split("^"); o[x] = +e || 1; }); return o; };
      const common = {};
      for (const x of vars) common[x] = Math.min(...mons.map(m => pw(m)[x] || 0));
      const cs = Object.values(Np).concat(Object.values(Dp)).map(c => approxRat(c));
      let gnum = cs.every(isInt) ? cs.reduce((g, c) => gcd(g, c.n), 0) : 1; if (!gnum) gnum = 1;
      const cut = P => { const o = {}; for (const m in P) { const p = pw(m); const k = Object.keys(p).sort().map(x => { const e = p[x] - (common[x] || 0); return e ? (e === 1 ? x : x + "^" + e) : ""; }).filter(Boolean).join("*"); o[k] = P[m] / gnum; } return o; };
      const n2 = polyStr(cut(Np)), d2 = polyStr(cut(Dp));
      const res = d2 === "1" ? n2 : wrapP(n2) + "/" + wrapP(d2);
      const cf = Object.entries(common).filter(([, e]) => e > 0).map(([x, e]) => e === 1 ? x : x + "^" + e).join("*");
      if (cf || gnum !== 1) steps.push(["= " + pretty(res), t("fracCancel", iso(pretty((gnum !== 1 ? gnum + (cf ? "*" : "") : "") + cf)))]);
      if (!steps.length) steps.push([orig, t("already")]);
      return { answer: pretty(res), steps };
    } catch (e) { return null; }
  }

  // ---------- two equations where one is not linear: substitution ----------
  function systemNL(lines) {
    let vars;
    try { vars = [...new Set(lines.flatMap(l => l.split("=").flatMap(p => symbols(M().parse(p)))))].sort(); } catch (e) { return null; }
    if (vars.length !== 2) return null;
    const E = lines.map(l => linear2(l, vars));
    const li = E.findIndex(e => e && (val(e.a) !== 0 || val(e.b) !== 0));
    if (li < 0 || E[1 - li]) return null;
    const lin = E[li], other = lines[1 - li], steps = [];
    const unit = k => isInt(k) && Math.abs(k.n) === 1;
    let iv = 0;
    if (val(lin.a) === 0 || (!unit(lin.a) && unit(lin.b) && val(lin.b) !== 0)) iv = 1;
    const isoV = vars[iv], w = vars[1 - iv], kIso = iv ? lin.b : lin.a, kW = iv ? lin.a : lin.b;
    const c0 = ops.divide(lin.c, kIso), c1 = neg(ops.divide(kW, kIso));
    const exprS = combo([[c0, ""], [c1, w]]);
    steps.push(["(" + (li + 1) + ")   " + combo([[lin.a, vars[0]], [lin.b, vars[1]]]) + " = " + fmt(lin.c), t("sysArrange", li + 1)]);
    steps.push([isoV + " = " + exprS, t("sysIsolate", isoV, li + 1)]);
    const repl = "(" + polyStr({ "": val(c0), [w]: val(c1) }) + ")";
    const sub = str => M().parse(str).transform(n => (n.type === "SymbolNode" && n.name === isoV ? M().parse(repl) : n)).toString();
    const [ol, orr] = other.split("=");
    const L = sub(ol), Rr = sub(orr);
    steps.push([pretty(L) + " = " + pretty(Rr), t("sysSub", 2 - li)]);
    let r; try { r = equation(L, Rr); } catch (e) { return null; }
    steps.push(...r.steps.filter(x => x[1] !== t("check")).map(([c, why]) => [c, why || t("sysNL")]));
    const roots = [...String(r.answer).replace(/[⁦-⁩]/g, "").matchAll(new RegExp(w + "\\s*[=≈]\\s*(−?[\\d./]+)", "g"))].map(m => { try { return M().evaluate(m[1].replace("−", "-")); } catch (e) { return null; } }).filter(x => x !== null);
    if (!roots.length) return { answer: r.answer, steps };
    const chk = lines.map(l => { const [a, b] = l.split("="); return [M().parse(a).compile(), M().parse(b).compile()]; });
    const pairs = [];
    for (const x of roots) {
      const y = val(c0) + val(c1) * x;
      steps.push([isoV + " = " + exprS.split(w).join(paren(approxRat(x))) + " = " + NS(y), t("sysBack", isoV)]);
      const sc = Object.assign({}, SCOPE, { [w]: x, [isoV]: y });
      if (chk.every(([a, b]) => { try { return close(a.evaluate(sc), b.evaluate(sc)); } catch (e) { return false; } })) pairs.push(vars.map(v => v === w ? x : y));
    }
    const pairS = pairs.map(([p, q]) => "(" + vars[0] + ", " + vars[1] + ") = (" + NS(p) + " , " + NS(q) + ")");
    steps.push([pairS.join("   ,   ") || "—", t("sysPairs")]);
    return { answer: pairs.length ? pairs.map(([p, q]) => iso(vars[0] + " = " + NS(p) + " ,  " + vars[1] + " = " + NS(q))).join(t("or")) : t("noSolution"), steps };
  }

  // ---------- exponential and log equations ----------
  const hasVar = (node, v) => symbols(node).includes(v);
  function constOf(node) { try { const r = node.compile().evaluate(Object.assign({}, SCOPE)); return typeof r === "number" && isFinite(r) ? r : null; } catch (e) { return null; } }
  function powForm(node, v) {               // k · a^E  →  {k, a, aS, E}
    node = unparen(node);
    let k = 1;
    if (node.type === "OperatorNode" && (node.fn === "multiply" || node.fn === "divide")) {
      const [p, q] = node.args.map(unparen);
      if (node.fn === "multiply" && !hasVar(p, v)) { const c = constOf(p); if (c === null) return null; k = c; node = q; }
      else if (node.fn === "multiply" && !hasVar(q, v)) { const c = constOf(q); if (c === null) return null; k = c; node = p; }
      else if (node.fn === "divide" && !hasVar(q, v)) { const c = constOf(q); if (!c) return null; k = 1 / c; node = p; }
      else return null;
      node = unparen(node);
    }
    if (node.type === "OperatorNode" && node.fn === "pow" && !hasVar(node.args[0], v) && hasVar(node.args[1], v)) {
      const a = constOf(node.args[0]); if (!(a > 0) || a === 1) return null;
      return { k, a, aS: P(node.args[0]), E: unparen(node.args[1]).toString() };
    }
    if (node.type === "FunctionNode" && node.fn.name === "exp") return { k, a: Math.E, aS: "e", E: unparen(node.args[0]).toString() };
    return null;
  }
  const isPowOf = (b, a) => { const k = Math.log(b) / Math.log(a), r = approxRat(k); return r.exact && r.d <= 12 && close(Math.pow(a, val(r)), b) ? r : null; };
  function expEquation(lhs, rhs, v) {
    let A = powForm(lhs, v), B = powForm(rhs, v), other = rhs;
    if (!A && B && !hasVar(lhs, v)) { A = B; B = null; other = lhs; }
    if (!A) return null;
    const steps = [];
    if (!B) {
      if (hasVar(other, v)) return null;
      let b = constOf(other); if (b === null) return null;
      if (A.k !== 1) { b = b / A.k; steps.push([powStrE(A) + " = " + NUM(b), t("expDiv", iso(NUM(A.k)))]); }
      if (b <= 0) { steps.push([powStrE(A) + " > 0", t("expPos")]); return { answer: t("noSolution"), steps }; }
      const k = isPowOf(b, A.a);
      if (k) {
        steps.push([powStrE(A) + " = " + A.aS + supE(fmt(k)), t("expSame")]);
        steps.push([P(A.E) + " = " + fmt(k), t("expEq")]);
        return chain(A.E, fmt(k), steps);
      }
      const L = Math.log(b) / Math.log(A.a);
      const logS = A.aS === "e" ? "ln(" + NUM(b) + ")" : A.a === 10 ? "log(" + NUM(b) + ")" : "log" + (isInt(approxRat(A.a)) ? subs(A.a) : "_" + A.aS) + "(" + NUM(b) + ")";
      steps.push([P(A.E) + " = " + logS + " ≈ " + round(L), t("expLog")]);
      return chain(A.E, String(L), steps);
    }
    // a^E1 = c^E2
    if (A.k !== 1 || B.k !== 1) return null;
    let m1 = 1, m2 = 1, base = A.aS;
    if (!close(A.a, B.a)) {
      const r1 = isPowOf(B.a, A.a), r2 = isPowOf(A.a, B.a);
      if (r1 && isInt(r1)) { m2 = r1.n; base = A.aS; }
      else if (r2 && isInt(r2)) { m1 = r2.n; base = B.aS; }
      else return null;
      const mul = (m, E) => (m === 1 ? P(E) : m + (/^\w$/.test(P(E)) ? P(E) : "(" + P(E) + ")"));
      const e1 = mul(m1, A.E), e2 = mul(m2, B.E);
      steps.push([base + supE(e1) + " = " + base + supE(e2), t("expSame")]);
    }
    const L1 = m1 === 1 ? A.E : m1 + "*(" + A.E + ")", L2 = m2 === 1 ? B.E : m2 + "*(" + B.E + ")";
    steps.push([P(L1).replace(/^(\d+)\((\w)\)$/, "$1$2") + " = " + P(L2).replace(/^(\d+)\((\w)\)$/, "$1$2"), t("expEq")]);
    return chain(L1, L2, steps);
  }
  const supE = s => /^[0-9−-]+$/.test(s) ? sup(s.replace("−", "-")) : s === "x" ? "ˣ" : /^(\d+(\.\d+)?|[a-z])$/.test(s) ? "^" + s : "^(" + s.replace(/^\((.*)\)$/, "$1") + ")";
  const powStrE = A => (A.k === 1 ? "" : "") + A.aS + supE(P(A.E));
  function chain(ls, rs, steps) {
    const r = equation(ls, rs);
    return { answer: r.answer, steps: steps.concat(r.steps.filter(x => x[1] !== t("check"))) };
  }
  const LOGS = { log10: 10, log: Math.E, log2: 2 };
  function logForm(node) {
    node = unparen(node);
    if (node.type !== "FunctionNode") return null;
    const n = node.fn.name;
    if (n in LOGS && node.args.length === 1) return { b: LOGS[n], bS: n === "log" ? "e" : String(LOGS[n]), E: node.args[0] };
    if (n === "logb" && node.args.length === 2) { const b = constOf(node.args[1]); if (b > 0 && b !== 1) return { b, bS: NUM(b), E: node.args[0] }; }
    return null;
  }
  function logEquation(lhs, rhs, v) {
    let A = logForm(lhs), B = logForm(rhs), other = rhs;
    if (!A && B) { A = B; B = null; other = lhs; }
    if (!A || !hasVar(A.E, v)) return null;
    const steps = [];
    let res;
    if (B) {
      if (!close(A.b, B.b)) return null;
      steps.push([P(A.E) + " = " + P(B.E), t("logEq")]);
      res = chain(A.E.toString(), B.E.toString(), steps);
    } else {
      if (hasVar(other, v)) return null;
      const k = constOf(other); if (k === null) return null;
      const val2 = Math.pow(A.b, k);
      steps.push([P(A.E) + " = " + A.bS + supE(NUM(k)) + (A.bS === "e" ? " ≈ " + round(val2) : " = " + NUM(val2)), t("logDef")]);
      res = chain(A.E.toString(), A.bS === "e" ? String(val2) : NUM(val2).replace("−", "-"), steps);
    }
    // domain check
    const xs = [...String(res.answer).replace(/[⁦-⁩]/g, "").matchAll(new RegExp(v + "\\s*=\\s*(?:≈\\s*)?(−?[\\d./]+)", "g"))].map(m => { try { return M().evaluate(m[1].replace("−", "-")); } catch (e) { return null; } }).filter(x => x !== null);
    const insides = [A.E].concat(B ? [B.E] : []).map(e => e.compile());
    const good = [], bad = [];
    for (const x of xs) (insides.every(c => { try { return c.evaluate({ [v]: x }) > 0; } catch (e) { return false; } }) ? good : bad).push(x);
    bad.forEach(x => res.steps.push([v + " = " + NUM(x), t("logBad", iso(v + " = " + NUM(x)))]));
    if (good.length) res.steps.push([good.map(x => v + " = " + NUM(x)).join("  ,  "), t("logOk")]);
    if (bad.length) res.answer = good.length ? good.map(x => iso(v + " = " + NS(x))).join(t("or")) : t("noSolution");
    return res;
  }

  // ---------- trig equations (degrees) ----------
  const DEGSCOPE = { sin: d => Math.sin(d * DEG), cos: d => Math.cos(d * DEG), tan: d => Math.tan(d * DEG) };
  const TRIG = new Set(["sin", "cos", "tan"]);
  const hasTrig = (node, v) => { let f = false; node.traverse(n => { if (n.type === "FunctionNode" && TRIG.has(n.fn.name) && n.args.some(a => hasVar(a, v))) f = true; }); return f; };
  let RANGE = null;
  function trigEquation(lhs, rhs, v, pre) {
    let F = unparen(lhs), other = rhs;
    if (!(F.type === "FunctionNode" && TRIG.has(F.fn.name)) || hasVar(other, v)) { F = unparen(rhs); other = lhs; }
    const steps = pre || [];
    if (!pre && !(F.type === "FunctionNode" && TRIG.has(F.fn.name) && !hasVar(other, v))) {
      // 2sin(x) − 1 = 0  →  sin(x) = 1/2
      const whole = M().parse("(" + lhs.toString() + ")-(" + rhs.toString() + ")");
      let tn = null, uniq = true;
      whole.traverse(n => { if (n.type === "FunctionNode" && TRIG.has(n.fn.name) && hasVar(n, v)) { if (tn && tn.toString() !== n.toString()) uniq = false; tn = tn || n; } });
      if (tn && uniq) {
        const key = tn.toString();
        const sub = whole.transform(n => (n.type === "FunctionNode" && n.toString() === key ? new (M().SymbolNode)("TRIGVAL") : n));
        if (!hasVar(sub, v)) {
          const lc = linCoef(sub.compile(), "TRIGVAL");
          if (lc && val(lc.p) !== 0) {
            const c = ops.divide(neg(lc.q), lc.p);
            steps.push([P(tn) + " = " + fmt(c), t("trigIso")]);
            return trigEquation(tn, M().parse(String(val(c))), v, steps);
          }
        }
      }
    }
    let sols = [], period = 360;
    const simple = F.type === "FunctionNode" && TRIG.has(F.fn.name) && !hasVar(other, v) && F.args.length === 1;
    const inner = simple ? linCoef(F.args[0].compile(), v) : null;
    if (simple && inner && val(inner.p) !== 0) {
      const fn = F.fn.name, c = constOf(other);
      if (c === null) return null;
      if (fn !== "tan" && Math.abs(c) > 1 + 1e-12) { steps.push(["|" + NUM(c) + "| > 1", t("trigNo")]); return { answer: t("noSolution"), steps }; }
      const inv = { sin: Math.asin, cos: Math.acos, tan: Math.atan }[fn];
      const al = cleanRoot(inv(Math.max(-1, Math.min(1, fn === "tan" ? c : c))) / DEG);
      const al2 = fn === "tan" ? cleanRoot(Math.atan(c) / DEG) : al;
      steps.push(["α = " + (fn === "sin" ? "sin⁻¹" : fn === "cos" ? "cos⁻¹" : "tan⁻¹") + "(" + NUM(c) + ") = " + deg(al2), t("trigBasic")]);
      const u = P(F.args[0]);
      let base;
      if (fn === "sin") { base = [al, 180 - al]; steps.push([u + " = " + deg(al) + " + 360°k" + t("or") + u + " = " + deg(180 - al) + " + 360°k", t("trigSinSol")]); }
      else if (fn === "cos") { base = [al, -al]; steps.push([u + " = " + deg(al) + " + 360°k" + t("or") + u + " = " + deg(-al) + " + 360°k", t("trigCosSol")]); }
      else { base = [al2]; steps.push([u + " = " + deg(al2) + " + 180°k", t("trigTanSol")]); }
      const per = fn === "tan" ? 180 : 360;
      base = [...new Set(base.map(cleanRoot))];
      const p = val(inner.p), q = val(inner.q);
      period = Math.abs(per / p);
      sols = base.map(b => cleanRoot((b - q) / p));
      if (!(p === 1 && q === 0)) steps.push([sols.map(s => v + " = " + deg(s) + " + " + NUM(period) + "°k").join(t("or")), t("trigSolveX", v)]);
    } else {
      const f = compileF("(" + lhs.toString() + ")-(" + rhs.toString() + ")", v, DEGSCOPE);
      sols = scanRoots(f, -0.0001, 359.9999, 0.25).roots.map(x => cleanRoot(Math.round(x * 1e6) / 1e6)).filter(x => x >= 0 && x < 360);
      sols = [...new Set(sols.map(x => Math.abs(x) < 1e-9 ? 0 : x))];
      if (!sols.length) { steps.push(["—", t("trigNum")]); return { answer: t("noSolution"), steps }; }
      steps.push([sols.map(s => v + " = " + deg(s)).join("  ,  "), t("trigNum")]);
    }
    if (RANGE) {
      const [a, b] = RANGE, inR = [];
      for (const s of sols) for (let k = Math.ceil((a - s) / period - 1e-9); s + k * period <= b + 1e-9; k++) inR.push(cleanRoot(s + k * period));
      const list = [...new Set(inR)].sort((x, y) => x - y);
      steps.push([list.length ? list.map(deg).join(" ,  ") : "—", list.length ? t("trigRange", a, b) : t("trigNoRange")]);
      return { answer: list.length ? iso(v + " = " + list.map(deg).join(", ")) : t("noSolution"), steps };
    }
    return { answer: sols.map(s => iso(v + " = " + deg(s) + " + " + NUM(period) + "°k")).join(t("or")) + "  " + t("kInt"), steps };
  }

  // ---------- calculus ----------
  function powerTerm(node, v) {                // c · v^n   →  {c, n}
    let g; try { g = compileF(node.toString(), v); } catch (e) { return null; }
    try {
      if (!hasVar(node, v)) return { c: g(1), n: 0 };
      const c = g(1); if (c === 0) return null;
      const n = Math.log(Math.abs(g(2) / c)) / Math.LN2, nr = approxRat(n);
      if (!nr.exact || nr.d > 6) return null;
      const nn = val(nr);
      for (const x of [3, 0.5, 5, 1.7]) if (!close(g(x), c * Math.pow(x, nn))) return null;
      return { c: val(approxRat(c)) === c || approxRat(c).exact ? val(approxRat(c)) : c, n: nn };
    } catch (e) { return null; }
  }
  function mono(c, n, v) {
    const C = approxRat(c);
    if (n === 0) return fmt(C);
    if (n < 0 && Number.isInteger(n)) return fmt(C) + "/" + powStr(v, rat(-n));
    if (n === 0.5) return term(C, "√" + v);
    if (n === -0.5 && C.exact) return (C.n < 0 ? "−" : "") + Math.abs(C.n) + "/(" + (C.d === 1 ? "" : C.d) + "√" + v + ")";
    return term(C, powStr(v, approxRat(n)));
  }
  function derivReason(node, v) {
    node = unparen(node);
    if (!hasVar(node, v)) return t("rConstD");
    if (node.type === "OperatorNode") {
      const [a, b] = node.args || [];
      if (node.fn === "unaryMinus") return derivReason(a, v);
      if (node.fn === "multiply") { if (!hasVar(a, v) || !hasVar(b, v)) return derivReason(hasVar(a, v) ? a : b, v); return t("rProdD"); }
      if (node.fn === "divide") return hasVar(b, v) ? t("rQuotD") : derivReason(a, v);
      if (node.fn === "pow") {
        if (!hasVar(b, v)) return unparen(a).type === "SymbolNode" ? t("rPowRule") : t("rChainD") + " (" + t("rPowRule") + ")";
        const base = unparen(a), simpleE = unparen(b).type === "SymbolNode";
        const r = base.type === "SymbolNode" && base.name === "e" ? t("rExpD") : t("rAxD");
        return simpleE ? r : t("rChainD") + " (" + r + ")";
      }
    }
    if (node.type === "FunctionNode") {
      const R = { sin: "rSinD", cos: "rCosD", tan: "rTanD", exp: "rExpD", log: "rLnD", sqrt: "rSqrtD", log10: "rLogD" }[node.fn.name];
      const simpleArg = node.args[0] && unparen(node.args[0]).type === "SymbolNode";
      if (R) return simpleArg ? t(R) : t("rChainD") + " (" + t(R) + ")";
    }
    return t("rChainD");
  }
  function dNode(str, v) { return M().simplify(M().derivative(str, v)); }
  function derivative(expr, v, at) {
    const steps = [], node = M().parse(expr);
    steps.push(["f(" + v + ") = " + P(expr), t("fnGiven")]);
    const terms = []; topTerms(node, 1, terms);
    if (terms.length > 1) {
      steps.push(["f'(" + v + ") = " + terms.map((tm, i) => (i ? (tm.sign < 0 ? " − " : " + ") : tm.sign < 0 ? "−" : "") + "(" + P(tm.node) + ")'").join(""), t("rSumD")]);
      for (const tm of terms) {
        const pt = powerTerm(tm.node, v);
        let d, why;
        if (pt) { d = pt.n === 0 ? "0" : mono(pt.c * pt.n, pt.n - 1, v); why = pt.n === 0 ? t("rConstD") : t("rPowRule"); }
        else { d = P(dNode(tm.node.toString(), v)); why = derivReason(tm.node, v); }
        steps.push(["(" + P(tm.node) + ")' = " + d, why]);
      }
    }
    const d = dNode(expr, v);
    let dS = P(d);
    try { const r = M().rationalize(d.toString()); if (r.toString().length <= d.toString().length) dS = P(r); } catch (e) { /* keep */ }
    const pts = terms.map(tm => powerTerm(tm.node, v));
    if (pts.every(Boolean) && /\/\d|\/\(|\/√/.test(dS)) {
      const parts = pts.map((pt, i) => ({ c: terms[i].sign * pt.c * pt.n, n: pt.n - 1 })).filter(p => p.c !== 0).sort((a, b) => b.n - a.n);
      if (parts.length) dS = parts.map((p, i) => { const m = mono(Math.abs(p.c), p.n, v); return (i === 0 ? (p.c < 0 ? "−" : "") : p.c < 0 ? " − " : " + ") + m; }).join("");
    }
    steps.push(["f'(" + v + ") = " + dS, terms.length > 1 ? t("fDeriv") : derivReason(node, v)]);
    let answer = iso("f'(" + v + ") = " + dS);
    if (at != null) {
      const dv = compileF(d.toString(), v)(at);
      steps.push(["f'(" + NUM(at) + ") = " + NS(dv), t("slopeAt")]);
      answer += "  ,  " + iso("f'(" + NUM(at) + ") = " + NS(dv));
    }
    return { answer, steps, d };
  }
  function tangent(expr, v, a) {
    if (a == null) fail(t("needPoint"));
    const r = derivative(expr, v, null), steps = r.steps;
    const f = compileF(expr, v), fp = compileF(r.d.toString(), v);
    const y0 = f(a), m = fp(a);
    steps.push(["f(" + NUM(a) + ") = " + NS(y0) + "   ⇒   (" + NUM(a) + " , " + NUM(y0) + ")", t("tanPoint")]);
    steps.push(["m = f'(" + NUM(a) + ") = " + NS(m), t("tanSlope")]);
    const M_ = approxRat(m), Y0 = approxRat(y0), A_ = approxRat(a);
    steps.push([lineThru(m, a, y0).replace(/x/g, v), t("tanLine")]);
    const b = ops.subtract(Y0, ops.multiply(M_, A_));
    const line = "y = " + combo([[M_, v], [b, ""]]);
    steps.push([line, t("tanFinal")]);
    return { answer: iso(line), steps };
  }
  function domainInfo(node, v, f) {
    const dens = []; let rooty = false;
    node.traverse(n => {
      if (n.type === "OperatorNode" && n.fn === "divide" && hasVar(n.args[1], v)) dens.push(n.args[1]);
      if (n.type === "OperatorNode" && n.fn === "pow" && hasVar(n.args[0], v) && constOf(n.args[1]) < 0) dens.push(n.args[0]);
      if (n.type === "FunctionNode" && ["sqrt", "log", "log10", "log2", "logb"].includes(n.fn.name)) rooty = true;
      if (n.type === "OperatorNode" && n.fn === "pow" && hasVar(n.args[0], v)) { const e = constOf(n.args[1]); if (e !== null && !Number.isInteger(e)) rooty = true; }
    });
    let holes = [];
    for (const d of dens) { try { holes = holes.concat(rootsOf(compileF(d.toString(), v), -60, 60)); } catch (e) { /* skip */ } }
    holes = [...new Set(holes.map(cleanRoot))].sort((a, b) => a - b);
    let edges = null;
    if (rooty) {                              // where is f defined? scan for the edges
      const st = 0.01, lo = -60, hi = 60; let prev = safe(f, lo) !== null; const runs = []; let start = prev ? -Infinity : null;
      const edge = (a, b, defAtA) => { for (let k = 0; k < 60; k++) { const m = (a + b) / 2; if ((safe(f, m) !== null) === defAtA) a = m; else b = m; } return cleanRoot(defAtA ? a : b); };
      for (let x = lo + st; x <= hi + 1e-9; x += st) {
        const ok = safe(f, x) !== null || (prev && holes.some(h => Math.abs(h - x) < st));
        if (ok && !prev) start = edge(x - st, x, false);
        if (!ok && prev) runs.push([start, edge(x - st, x, true)]);
        prev = ok;
      }
      if (prev) runs.push([start, Infinity]);
      edges = runs;
    }
    return { holes, edges };
  }
  function investigate(expr, v) {
    const node = M().parse(expr), steps = [];
    const f = compileF(expr, v);
    steps.push(["f(" + v + ") = " + P(expr), t("fnGiven")]);
    const dom = domainInfo(node, v, f);
    const inDom = x => safe(f, x) !== null;
    if (dom.edges && dom.edges.length) {
      const txt = dom.edges.map(([a, b]) => {
        const ca = isFinite(a) && inDom(a), cb = isFinite(b) && inDom(b);
        if (!isFinite(a) && !isFinite(b)) return t("everyValue", v);
        if (!isFinite(a)) return v + (cb ? " ≤ " : " < ") + NS(b);
        if (!isFinite(b)) return v + (ca ? " ≥ " : " > ") + NS(a);
        return NS(a) + (ca ? " ≤ " : " < ") + v + (cb ? " ≤ " : " < ") + NS(b);
      }).join(t("or"));
      steps.push([txt + (dom.holes.length ? " ,  " + dom.holes.map(h => v + " ≠ " + NS(h)).join(" , ") : ""), t("domRoot")]);
    } else if (dom.holes.length) steps.push([dom.holes.map(h => v + " ≠ " + NS(h)).join("  ,  "), t("domNot")]);
    else steps.push([v + " ∈ ℝ", t("domAll")]);
    const d = dNode(expr, v);
    let dS = P(d);
    try { const r = M().rationalize(d.toString()); if (r.toString().length <= d.toString().length + 4) dS = P(r); } catch (e) { /* keep */ }
    steps.push(["f'(" + v + ") = " + dS, t("fDeriv")]);
    const g = compileF(d.toString(), v);
    let lo = -60, hi = 60;
    if (dom.edges && dom.edges.length) { lo = Math.max(lo, ...dom.edges.map(e => e[0]).filter(isFinite).map(x => x - 1)); hi = Math.min(hi, ...dom.edges.map(e => e[1]).filter(isFinite).map(x => x + 1)); }
    let crit = rootsOf(g, lo, hi).filter(x => inDom(x));
    crit = [...new Set(crit.map(cleanRoot))].sort((a, b) => a - b);
    steps.push([crit.length ? crit.map(c => v + " = " + NS(c)).join("  ,  ") : "f'(" + v + ") ≠ 0", crit.length ? t("crit") : t("noCrit")]);
    // where does f' change sign
    const edgePts = dom.edges ? dom.edges.flat().filter(isFinite) : [];
    const pts = [...new Set(crit.concat(dom.holes, edgePts))].sort((a, b) => a - b);
    const regions = [];
    for (let i = 0; i <= pts.length; i++) {
      const a = i === 0 ? -Infinity : pts[i - 1], b = i === pts.length ? Infinity : pts[i];
      const x = !isFinite(a) && !isFinite(b) ? 0 : !isFinite(a) ? b - 1 : !isFinite(b) ? a + 1 : (a + b) / 2;
      const s = safe(g, x);
      if (s === null || safe(f, x) === null) continue;
      regions.push({ a, b, up: s > 0 });
    }
    const rTxt = regions.map(r => (!isFinite(r.a) && !isFinite(r.b) ? "" : !isFinite(r.a) ? v + " < " + NS(r.b) : !isFinite(r.b) ? v + " > " + NS(r.a) : NS(r.a) + " < " + v + " < " + NS(r.b)) + ":  f' " + (r.up ? "> 0 ↗" : "< 0 ↘")).join("   |   ");
    if (regions.length) steps.push([rTxt, t("incdec")]);
    const ext = [];
    for (const c of crit) {
      const L = regions.find(r => close(r.b, c)), R = regions.find(r => close(r.a, c));
      const y = f(c), pt = "(" + NS(c) + " , " + NS(y) + ")";
      if (L && R && L.up && !R.up) { ext.push(t("maxW") + " " + pt); steps.push([t("maxW") + "  " + pt, t("extMax")]); }
      else if (L && R && !L.up && R.up) { ext.push(t("minW") + " " + pt); steps.push([t("minW") + "  " + pt, t("extMin")]); }
      else steps.push([pt, t("extNone")]);
    }
    if (inDom(0)) steps.push(["f(0) = " + NS(f(0)) + "   ⇒   (0 , " + NS(f(0)) + ")", t("yInt")]);
    const zs = rootsOf(f, lo, hi).filter(x => inDom(x));
    steps.push([zs.length ? zs.map(z => "(" + NS(z) + " , 0)").join("  ,  ") : "f(" + v + ") ≠ 0", zs.length ? t("xInt") : t("noXInt")]);
    for (const h of dom.holes) { const a = safe(f, h - 1e-6), b = safe(f, h + 1e-6); if ((a !== null && Math.abs(a) > 1e4) || (b !== null && Math.abs(b) > 1e4)) steps.push([v + " = " + NS(h), t("vAsym")]); }
    const far = [safe(f, 1e6), safe(f, 1e7), safe(f, -1e6), safe(f, -1e7)];
    if (far[0] !== null && far[1] !== null && Math.abs(far[0] - far[1]) < 1e-4 * (1 + Math.abs(far[1])) && Math.abs(far[1]) < 1e6) {
      const L = cleanRoot(Math.round(far[1] * 1e5) / 1e5);
      steps.push(["y = " + NUM(L), t("hAsym")]);
    }
    const mono_ = regions.length ? regions.map(r => (r.up ? t("incW") : t("decW")) + ": " + iso(!isFinite(r.a) && !isFinite(r.b) ? v + " ∈ ℝ" : !isFinite(r.a) ? v + " < " + NS(r.b) : !isFinite(r.b) ? v + " > " + NS(r.a) : NS(r.a) + " < " + v + " < " + NS(r.b))).join(" ;  ") : "";
    return { answer: (ext.length ? ext.map(e => e.replace(/\(.*\)/, m => iso(m))).join(" ,  ") : t("noExt")) + (mono_ ? "\n" + mono_ : ""), steps };
  }
  // ∫ of one term: returns {F (mathjs), show, why} or null
  function antiTerm(node, sign, v) {
    const pt = powerTerm(node, v);
    if (pt) {
      const c = sign * pt.c;
      if (pt.n === -1) return { F: c + "*log(abs(" + v + "))", show: term(approxRat(c), "ln|" + v + "|"), why: t("intLn") };
      const k = c / (pt.n + 1);
      return { F: "(" + k + ")*" + v + "^(" + pt.n + "+1)", show: mono(k, pt.n + 1, v), why: pt.n === 0 ? t("intConst") : t("intPow") };
    }
    // k · g(ax+b) with g = sin, cos, exp, e^, 1/
    const fs = []; factorList(node, fs);
    let k = sign, g = null;
    for (const f of fs) { if (!hasVar(f, v)) { const c = constOf(f); if (c === null) return null; k *= c; } else if (g) return null; else g = unparen(f); }
    if (!g) return null;
    let kind = null, inner = null;
    if (g.type === "FunctionNode" && ["sin", "cos", "exp"].includes(g.fn.name)) { kind = g.fn.name; inner = g.args[0]; }
    else if (g.type === "OperatorNode" && g.fn === "pow" && unparen(g.args[0]).type === "SymbolNode" && unparen(g.args[0]).name === "e") { kind = "exp"; inner = g.args[1]; }
    else if (g.type === "OperatorNode" && g.fn === "divide" && !hasVar(g.args[0], v)) { const c = constOf(g.args[0]); if (c === null) return null; k *= c; kind = "rec"; inner = g.args[1]; }
    if (!kind) return null;
    inner = unparen(inner);
    const lc = linCoef(inner.compile(), v);
    if (!lc || val(lc.p) === 0) return null;
    const a = val(lc.p), K = k / a, u = inner.toString(), uS = P(u);
    if (kind === "sin") return { F: "(" + (-K) + ")*cos(" + u + ")", show: term(approxRat(-K), "cos(" + uS + ")"), why: t("intSin") };
    if (kind === "cos") return { F: "(" + K + ")*sin(" + u + ")", show: term(approxRat(K), "sin(" + uS + ")"), why: t("intCos") };
    if (kind === "exp") return { F: "(" + K + ")*e^(" + u + ")", show: term(approxRat(K), "e" + supE(uS)), why: t("intExp") };
    return { F: "(" + K + ")*log(abs(" + u + "))", show: term(approxRat(K), "ln|" + uS + "|"), why: t("intLinRec") };
  }
  function simpson(f, a, b) {
    const n = 2000, h = (b - a) / n; let s = f(a) + f(b);
    for (let i = 1; i < n; i++) s += (i % 2 ? 4 : 2) * f(a + i * h);
    return s * h / 3;
  }
  function integral(expr, v, A, B, area) {
    const node = M().parse(expr), steps = [];
    const terms = []; topTerms(node, 1, terms);
    const pieces = terms.map(tm => antiTerm(tm.node, tm.sign, v));
    const ok = pieces.every(Boolean);
    const defn = A != null;
    steps.push([(defn ? "∫ [" + NUMP(A) + " , " + NUMP(B) + "]  " : "∫ ") + "(" + P(expr) + ") d" + v, t("intGiven")]);
    if (!ok && !defn) fail(t("intCant"));
    let Fstr = null, Fshow = null;
    if (ok) {
      const wrap = x => (/[+\-−\s]/.test(x) ? "(" + x + ")" : x);
      if (terms.length > 1) pieces.forEach((p, i) => steps.push(["∫ " + (terms[i].sign < 0 ? "−" : "") + wrap(P(terms[i].node)) + " d" + v + " = " + p.show, p.why]));
      Fshow = pieces.map((p, i) => (i && !p.show.startsWith("−") ? " + " : i ? " − " : "") + (i && p.show.startsWith("−") ? p.show.slice(1) : p.show)).join("");
      Fstr = pieces.map(p => "(" + p.F + ")").join("+");
      steps.push(["F(" + v + ") = " + Fshow + (defn ? "" : " + C"), terms.length > 1 ? t("intC") : pieces[0].why]);
      if (!defn) return { answer: iso(Fshow + " + C"), steps };
    }
    const f = compileF(expr, v);
    const Ff = ok ? compileF(Fstr, v) : null;
    const defI = (a, b) => { if (Ff) { try { return Ff(b) - Ff(a); } catch (e) { /* fall back */ } } return simpson(f, a, b); };
    if (!area) {
      const I = defI(A, B);
      if (Ff) steps.push(["F(" + NUMP(B) + ") − F(" + NUMP(A) + ") = " + NS(Ff(B)) + " − " + paren(approxRat(Ff(A))) + " = " + NS(I), t("newton")]);
      else steps.push([NS(I), t("numInt")]);
      return { answer: iso("= " + NS(I)), steps };
    }
    const zs = scanRoots(f, A, B, (B - A) / 2000).roots.filter(z => z > A + 1e-9 && z < B - 1e-9);
    const cuts = [A, ...zs, B];
    if (zs.length) steps.push([zs.map(z => v + " = " + NS(z)).join("  ,  "), t("areaSplit")]);
    let total = 0; const partS = [];
    for (let i = 0; i + 1 < cuts.length; i++) {
      const I = defI(cuts[i], cuts[i + 1]); total += Math.abs(I);
      partS.push("|∫ [" + NUMP(cuts[i]) + " , " + NUMP(cuts[i + 1]) + "]| = " + NS(Math.abs(I)));
    }
    steps.push([partS.join("   ,   "), Ff ? t("newton") : t("numInt")]);
    steps.push(["S = " + NS(total), t("areaSum")]);
    return { answer: iso("S = " + NS(total)), steps };
  }

  // ---------- sequences ----------
  const aS = n => "a" + subs(n), sS = n => "S" + subs(n);
  function seqFromList(nums) {
    const steps = [], n = nums.length;
    const R = nums.map(x => approxRat(x));
    const diffs = R.slice(1).map((x, i) => ops.subtract(x, R[i]));
    if (diffs.every(d => close(val(d), val(diffs[0])))) {
      const d = diffs[0], a1 = R[0];
      steps.push([R.slice(1).map((x, i) => fmt(x) + " − " + paren(R[i]) + " = " + fmt(d)).slice(0, 3).join("  ,  "), t("seqArith", iso(fmt(d)))]);
      const c0 = ops.subtract(a1, d);
      steps.push(["aₙ = a₁ + (n − 1)d = " + fmt(a1) + " + (n − 1)·" + paren(d) + " = " + combo([[d, "n"], [c0, ""]]), t("seqGeneral")]);
      const next = [1, 2, 3].map(k => ops.add(R[n - 1], ops.multiply(d, rat(k))));
      steps.push([next.map(fmt).join(", ") + ", …", t("seqNext")]);
      const Sn = ops.multiply(rat(n, 2), ops.add(ops.multiply(rat(2), a1), ops.multiply(rat(n - 1), d)));
      steps.push([sS(n) + " = n(2a₁ + (n − 1)d) ÷ 2 = " + n + "·(2·" + paren(a1) + " + " + (n - 1) + "·" + paren(d) + ") ÷ 2 = " + fmt(Sn), t("seqSumF")]);
      return { answer: iso("d = " + fmt(d)) + " ,  " + iso("aₙ = " + combo([[d, "n"], [c0, ""]])), steps };
    }
    if (R.every(x => val(x) !== 0)) {
      const qs = R.slice(1).map((x, i) => ops.divide(x, R[i]));
      if (qs.every(q => close(val(q), val(qs[0])))) {
        const q = qs[0], a1 = R[0];
        steps.push([R.slice(1).map((x, i) => fmt(x) + " ÷ " + paren(R[i]) + " = " + fmt(q)).slice(0, 3).join("  ,  "), t("seqGeo", iso(fmt(q)))]);
        steps.push(["aₙ = a₁·qⁿ⁻¹ = " + fmt(a1) + "·" + paren(q) + "ⁿ⁻¹", t("seqGeneral")]);
        const next = []; let last = R[n - 1]; for (let k = 0; k < 3; k++) { last = ops.multiply(last, q); next.push(last); }
        steps.push([next.map(fmt).join(", ") + ", …", t("seqNext")]);
        if (val(q) !== 1) { const Sn = ops.divide(ops.multiply(a1, ops.subtract(ops.pow(q, rat(n)), rat(1))), ops.subtract(q, rat(1)));
          steps.push([sS(n) + " = a₁(qⁿ − 1) ÷ (q − 1) = " + fmt(Sn), t("seqSumF")]); }
        return { answer: iso("q = " + fmt(q)) + " ,  " + iso("aₙ = " + fmt(a1) + "·" + paren(q) + "ⁿ⁻¹"), steps };
      }
    }
    return null;
  }
  function seqGivens(raw) {
    const s = String(raw).replace(/[−–]/g, "-");
    const num = "(-?\\d+(?:\\.\\d+)?(?:\\/\\d+)?)";
    const ev = x => M().evaluate(x);
    const terms = {};
    for (const m of s.matchAll(new RegExp("\\ba\\s*_?\\s*\\{?(\\d+)\\}?\\s*=\\s*" + num, "gi"))) terms[+m[1]] = ev(m[2]);
    const g = re => { const m = s.match(re); return m ? ev(m[1]) : null; };
    let d = g(new RegExp("\\bd\\s*=\\s*" + num, "i")), q = g(new RegExp("\\bq\\s*=\\s*" + num, "i"));
    let n = g(/\bn\s*=\s*(\d+)/i);
    let Sk = null; { const m = s.match(new RegExp("\\bS\\s*_?\\s*\\{?(\\d+)\\}?\\s*=\\s*" + num)); if (m) Sk = { k: +m[1], v: ev(m[2]) }; }
    const asked = []; for (const m of s.matchAll(/\b([aS])\s*_?\s*(?:\{(\d+)\}|(\d+)(?!\d))(?!\s*=\s*-?\d)/g)) asked.push({ w: m[1], k: +(m[2] || m[3]) });
    const infinite = /אינסופ|infinite/i.test(s);
    const geo = q !== null || /הנדסית|geometric/i.test(s);
    const steps = [];
    const ks = Object.keys(terms).map(Number).sort((a, b) => a - b);
    let a1 = terms[1] ?? null;
    if (!geo) {
      if (d === null && ks.length >= 2) {
        const [k, m] = [ks[0], ks[ks.length - 1]];
        d = (terms[m] - terms[k]) / (m - k);
        steps.push(["d = (" + NUM(terms[m]) + " − " + paren(approxRat(terms[k])) + ") ÷ (" + m + " − " + k + ") = " + NUM(d), t("seqFindD")]);
      }
      if (a1 === null && d !== null && ks.length) {
        const k = ks[0]; a1 = terms[k] - (k - 1) * d;
        steps.push([aS(k) + " = a₁ + " + (k - 1) + "·" + paren(approxRat(d)) + "   ⇒   a₁ = " + NUM(a1), t("seqFindA1")]);
      }
      if (a1 !== null && d === null && Sk && Sk.k > 1) {
        d = (2 * Sk.v / Sk.k - 2 * a1) / (Sk.k - 1);
        steps.push([sS(Sk.k) + " = " + Sk.k + "(2·" + NUM(a1) + " + " + (Sk.k - 1) + "d) ÷ 2 = " + NUM(Sk.v) + "   ⇒   d = " + NUM(d), t("seqSumF")]);
      }
      if (a1 === null || d === null) fail(t("seqNeed"));
      const D = approxRat(d), A1 = approxRat(a1);
      steps.push(["aₙ = " + fmt(A1) + " + (n − 1)·" + paren(D) + " = " + combo([[D, "n"], [ops.subtract(A1, D), ""]]), t("seqGeneral")]);
      if (Sk && n === null && !asked.length && Sk.k == null) { /* nothing */ }
      const out = [];
      const targets = asked.length ? asked : n !== null ? [{ w: "a", k: n }, { w: "S", k: n }] : [];
      for (const tg of targets) {
        if (tg.w === "a") { const v = a1 + (tg.k - 1) * d; steps.push([aS(tg.k) + " = " + fmt(A1) + " + " + (tg.k - 1) + "·" + paren(D) + " = " + NUM(v), t("seqGeneral")]); out.push(aS(tg.k) + " = " + NUM(v)); }
        else { const v = tg.k * (2 * a1 + (tg.k - 1) * d) / 2; steps.push([sS(tg.k) + " = " + tg.k + "·(2·" + paren(A1) + " + " + (tg.k - 1) + "·" + paren(D) + ") ÷ 2 = " + NUM(v), t("seqSumF")]); out.push(sS(tg.k) + " = " + NUM(v)); }
      }
      // find n when a term value is asked: "an = 50"
      const an = s.match(new RegExp("\\ba\\s*_?\\s*n\\s*=\\s*" + num, "i"));
      if (an) { const v = ev(an[1]), nn = (v - a1) / d + 1;
        if (Number.isInteger(Math.round(nn * 1e9) / 1e9) && nn >= 1) { steps.push([NUM(a1) + " + (n − 1)·" + paren(D) + " = " + NUM(v) + "   ⇒   n = " + NUM(nn), t("seqFindN")]); out.push("n = " + NUM(nn)); }
        else { steps.push(["n = " + NUM(nn), t("seqBadN")]); out.push(t("seqBadN")); } }
      return { answer: [iso("a₁ = " + fmt(A1)), iso("d = " + fmt(D))].concat(out.map(o => /[a-zA-Z]/.test(o) ? iso(o) : o)).join(" ,  "), steps };
    }
    // geometric
    let qs = q !== null ? [q] : [];
    if (!qs.length && ks.length >= 2) {
      const [k, m] = [ks[0], ks[ks.length - 1]], ratio = terms[m] / terms[k], p = m - k;
      let r = Math.pow(Math.abs(ratio), 1 / p);
      r = cleanRoot(r);
      if (ratio < 0 && p % 2 === 0) fail(t("seqNeed"));
      qs = ratio < 0 ? [-r] : p % 2 === 0 ? [r, -r] : [r];
      steps.push(["q" + sup(p) + " = " + NUM(terms[m]) + " ÷ " + paren(approxRat(terms[k])) + " = " + NUM(ratio) + "   ⇒   q = " + qs.map(NUM).join(" , "), t("seqFindQ")]);
    }
    if (!qs.length) fail(t("seqNeed"));
    const outs = [];
    for (const qq of qs) {
      let A = a1;
      if (A === null && ks.length) { const k = ks[0]; A = terms[k] / Math.pow(qq, k - 1); steps.push([aS(k) + " = a₁·" + paren(approxRat(qq)) + sup(k - 1) + "   ⇒   a₁ = " + NUM(A), t("seqFindA1g")]); }
      if (A === null) fail(t("seqNeed"));
      const Q = approxRat(qq), A1 = approxRat(A);
      steps.push(["aₙ = " + fmt(A1) + "·" + paren(Q) + "ⁿ⁻¹", t("seqGeneral")]);
      const out = [iso("a₁ = " + fmt(A1)), iso("q = " + fmt(Q))];
      const targets = asked.length ? asked : n !== null ? [{ w: "a", k: n }, { w: "S", k: n }] : [];
      for (const tg of targets) {
        if (tg.w === "a") { const v = A * Math.pow(qq, tg.k - 1); steps.push([aS(tg.k) + " = " + fmt(A1) + "·" + paren(Q) + sup(tg.k - 1) + " = " + NUM(v), t("seqGeneral")]); out.push(iso(aS(tg.k) + " = " + NUM(v))); }
        else if (qq !== 1) { const v = A * (Math.pow(qq, tg.k) - 1) / (qq - 1); steps.push([sS(tg.k) + " = " + fmt(A1) + "·(" + paren(Q) + sup(tg.k) + " − 1) ÷ (" + fmt(Q) + " − 1) = " + NUM(v), t("seqSumF")]); out.push(iso(sS(tg.k) + " = " + NUM(v))); }
      }
      if (infinite) {
        if (Math.abs(qq) < 1) { const S = A / (1 - qq); steps.push(["S = " + fmt(A1) + " ÷ (1 − " + paren(Q) + ") = " + NUM(S), t("seqInf")]); out.push(iso("S = " + NUM(S))); }
        else steps.push(["|q| = " + NUM(Math.abs(qq)) + " ≥ 1", t("seqInfNo")]);
      }
      outs.push(out.join(" ,  "));
    }
    return { answer: outs.join(t("or")), steps };
  }

  // ---------- analytic geometry ----------
  const ptS = (x, y) => "(" + NUM(x) + " , " + NUM(y) + ")";
  const minus = (v, a) => (close(a, 0) ? v : a > 0 ? v + " − " + NUM(a) : v + " + " + NUM(-a));
  const sqr = (v, a) => (close(a, 0) ? v + "²" : "(" + minus(v, a) + ")²");
  const lineThru = (m, x1, y1) => minus("y", y1) + " = " + (close(m, 1) ? minus("x", x1) : (close(m, -1) ? "−" : paren(approxRat(m))) + (close(x1, 0) ? "x" : "(" + minus("x", x1) + ")"));
  function lineFrom(m, x1, y1) {
    const M_ = approxRat(m), b = ops.subtract(approxRat(y1), ops.multiply(M_, approxRat(x1)));
    return "y = " + combo([[M_, "x"], [b, ""]]);
  }
  function points(pts, raw) {
    const steps = [];
    if (pts.length === 2) {
      const [[x1, y1], [x2, y2]] = pts;
      const dx = x2 - x1, dy = y2 - y1, d2 = dx * dx + dy * dy;
      let line;
      if (close(dx, 0)) { line = "x = " + NUM(x1); steps.push([line, t("vertLine")]); }
      else {
        const m = dy / dx;
        steps.push(["m = (" + NUM(y2) + " − " + paren(approxRat(y1)) + ") ÷ (" + NUM(x2) + " − " + paren(approxRat(x1)) + ") = " + NUM(m), t("slope")]);
        steps.push([lineThru(m, x1, y1), t("lineEq")]);
        line = lineFrom(m, x1, y1); steps.push([line, t("lineSlope")]);
      }
      steps.push(["d = √(" + paren(approxRat(dx)) + "² + " + paren(approxRat(dy)) + "²) = √" + NUM(d2) + " = " + rootStr(d2), t("dist")]);
      steps.push(["M = " + ptS((x1 + x2) / 2, (y1 + y2) / 2), t("mid")]);
      return { answer: iso(line) + " ,  " + t("distW") + " " + iso(rootStr(d2).replace(/ ≈.*/, "")) + " ,  " + t("midW") + " " + iso(ptS((x1 + x2) / 2, (y1 + y2) / 2)), steps };
    }
    const [[x1, y1], [x2, y2], [x3, y3]] = pts;
    const L = [[x1, y1, x2, y2, "AB"], [x2, y2, x3, y3, "BC"], [x1, y1, x3, y3, "AC"]].map(([a, b, c, d, n]) => ({ n, s: (c - a) ** 2 + (d - b) ** 2 }));
    steps.push([L.map(l => l.n + " = " + rootStr(l.s).replace(/ ≈.*/, "")).join("  ,  "), t("triSides")]);
    const S = Math.abs(x1 * (y2 - y3) + x2 * (y3 - y1) + x3 * (y1 - y2)) / 2;
    steps.push(["S = ½|" + NUM(x1) + "·(" + NUM(y2) + " − " + paren(approxRat(y3)) + ") + " + NUM(x2) + "·(" + NUM(y3) + " − " + paren(approxRat(y1)) + ") + " + NUM(x3) + "·(" + NUM(y1) + " − " + paren(approxRat(y2)) + ")| = " + NUM(S), t("triArea")]);
    const sq = L.map(l => l.s).sort((a, b) => a - b);
    if (close(sq[0] + sq[1], sq[2])) steps.push([NUM(sq[0]) + " + " + NUM(sq[1]) + " = " + NUM(sq[2]), t("triRight")]);
    return { answer: t("areaW") + " " + iso("S = " + NUM(S)), steps };
  }
  function xyFit(ls, rs) {
    const code = M().parse("(" + ls + ")-(" + rs + ")").compile();
    const F = (x, y) => { const r = code.evaluate(Object.assign({}, SCOPE, { x, y })); if (typeof r !== "number" || !isFinite(r)) throw new Error("nan"); return r; };
    const F0 = F(0, 0), A = (F(1, 0) + F(-1, 0)) / 2 - F0, D = (F(1, 0) - F(-1, 0)) / 2, B = (F(0, 1) + F(0, -1)) / 2 - F0, E = (F(0, 1) - F(0, -1)) / 2;
    const C = F(1, 1) - A - B - D - E - F0;
    for (const [x, y] of [[2, 3], [-1, 4], [0.5, -2], [3, -3]]) if (!close(F(x, y), A * x * x + B * y * y + C * x * y + D * x + E * y + F0)) return null;
    return { A, B, C, D, E, F0 };
  }
  function xyEquation(ls, rs) {
    let K; try { K = xyFit(ls, rs); } catch (e) { return null; }
    if (!K) return null;
    const { A, B, C, D, E, F0 } = K, steps = [];
    const z = x => Math.abs(x) < 1e-12;
    if (z(A) && z(B) && z(C)) {                       // a line
      if (z(E)) { if (z(D)) return null; const x0 = -F0 / D; steps.push(["x = " + NUM(x0), t("vertLine")]); return { answer: iso("x = " + NUM(x0)), steps }; }
      const m = -D / E, b = -F0 / E, line = "y = " + combo([[approxRat(m), "x"], [approxRat(b), ""]]);
      steps.push([line, t("lineSlope")]);
      steps.push(["m = " + NUM(m) + "  ,  (0 , " + NUM(b) + ")", t("slopeW")]);
      if (!z(m)) steps.push(["0 = " + combo([[approxRat(m), "x"], [approxRat(b), ""]]) + "   ⇒   x = " + NUM(-b / m) + "   ⇒   (" + NUM(-b / m) + " , 0)", t("xIntLine")]);
      return { answer: iso(line) + " ,  " + t("slopeW") + " " + iso("m = " + NUM(m)), steps };
    }
    if (z(C) && !z(A) && close(A, B)) {              // a circle
      const a = -D / (2 * A), b = -E / (2 * A), R2 = a * a + b * b - F0 / A;
      steps.push([sqr("x", a) + " + " + sqr("y", b) + " = " + NUM(R2), t("circleStd")]);
      if (R2 <= 0) { steps.push(["R² = " + NUM(R2), t("circleNo")]); return { answer: t("noSolution"), steps }; }
      const R = rootStr(R2);
      steps.push([t("centerW") + " " + ptS(a, b) + "  ,  R = " + R, t("circleRes")]);
      return { answer: t("centerW") + " " + iso(ptS(a, b)) + " ,  " + t("radiusW") + " " + iso("R = " + R.replace(/ ≈.*/, "")), steps };
    }
    if (z(B) && z(C) && !z(E) && !z(A)) {            // y = ax² + bx + c
      const a = -A / E, b = -D / E, c = -F0 / E;
      const Q = { a: approxRat(a), b: approxRat(b), c: approxRat(c) };
      steps.push(["y = " + combo([[Q.a, "x²"], [Q.b, "x"], [Q.c, ""]]), t("fnGiven")]);
      const xv = -b / (2 * a), yv = a * xv * xv + b * xv + c;
      steps.push(["x = −" + paren(Q.b) + " ÷ (2·" + paren(Q.a) + ") = " + NUM(xv) + "   ,   y = " + NUM(yv), t("parVertex")]);
      steps.push([a > 0 ? "∪" : "∩", t("parOpen", a > 0)]);
      steps.push(["(0 , " + NUM(c) + ")", t("yInt")]);
      const rs_ = quadRoots(Q).map(cleanRoot);
      steps.push([rs_.length ? rs_.map(r => "(" + NS(r) + " , 0)").join("  ,  ") : "D < 0", rs_.length ? t("xInt") : t("noXInt")]);
      return { answer: t("vertexW") + " " + iso(ptS(xv, yv)), steps };
    }
    return null;
  }
  function pointsTopic(raw) {
    const pts = [...String(raw).replace(/[−–]/g, "-").matchAll(/\(\s*(-?\d+(?:\.\d+)?)\s*[,;]\s*(-?\d+(?:\.\d+)?)\s*\)/g)].map(m => [parseFloat(m[1]), parseFloat(m[2])]);
    if (!pts.length) return null;
    const s = String(raw).replace(/[−–]/g, "-");
    const radius = s.match(/(?:רדיוס|radius|\bR|\br)\s*(?:=|:|שווה|is|של)?\s*(\d+(?:\.\d+)?)/i);
    if (pts.length === 1 && radius) {
      const [a, b] = pts[0], R = parseFloat(radius[1]);
      const eq = sqr("x", a) + " + " + sqr("y", b) + " = " + NUM(R * R);
      const steps = [[eq, t("circleEq")]];
      return { problem: t("centerW") + " " + ptS(a, b) + " , R = " + NUM(R), answer: iso(eq), steps };
    }
    const slopeM = s.match(/(?:שיפוע|slope|\bm)\s*(?:=|:|שווה|is|של)?\s*(-?\d+(?:\.\d+)?(?:\/\d+)?)/i);
    const lineM = s.match(/y\s*=\s*([^,;]+)/);
    if (pts.length === 1 && (slopeM || lineM)) {
      const [x1, y1] = pts[0], steps = [];
      let m;
      if (lineM && /מקביל|parallel|מאונך|ניצב|perpendicular/i.test(s)) {
        const ex = normalize(lineM[1]); const lc = linCoef(M().parse(ex).compile(), "x");
        if (!lc) return null;
        const m0 = val(lc.p);
        if (/מאונך|ניצב|perpendicular/i.test(s)) { if (m0 === 0) return null; m = -1 / m0; steps.push(["m = −1 ÷ " + paren(approxRat(m0)) + " = " + NUM(m), t("perpSlope")]); }
        else { m = m0; steps.push(["m = " + NUM(m), t("parSlope")]); }
      } else if (slopeM) m = M().evaluate(slopeM[1]);
      else return null;
      steps.push([lineThru(m, x1, y1), t("lineEq")]);
      const line = lineFrom(m, x1, y1); steps.push([line, t("lineSlope")]);
      return { problem: ptS(x1, y1) + " , m = " + NUM(m), answer: iso(line), steps };
    }
    if (pts.length === 2 || pts.length === 3) {
      const r = points(pts, raw);
      return { problem: pts.map(p => ptS(p[0], p[1])).join("  "), answer: r.answer, steps: r.steps };
    }
    return null;
  }

  // ---------- counting ----------
  function factSteps(n) {
    if (n > 170) fail(t("combBig"));
    const parts = []; for (let k = n; k >= 1 && parts.length < 8; k--) parts.push(k);
    const v = factorialBig(n);
    return [[n + "! = " + parts.join("·") + (n > 8 ? "·…·1" : "") + " = " + v, t("factDef")]];
  }
  function factorialBig(n) { let r = 1n; for (let k = 2n; k <= BigInt(n); k++) r *= k; return r.toString(); }
  function combTopic(raw) {
    const s = String(raw);
    let m;
    if ((m = s.match(/^\s*(\d+)\s*!\s*$/))) return { problem: m[1] + "!", answer: factorialBig(+m[1]).length > 18 ? "≈ " + Number(factorialBig(+m[1])).toExponential(4) : factorialBig(+m[1]), steps: factSteps(+m[1]) };
    let kind = null, n, k;
    const C = [/\b(?:C|nCr)\s*\(\s*(\d+)\s*,\s*(\d+)\s*\)/, /\b(\d+)\s*C\s*(\d+)\b/, /\(\s*(\d+)\s+(?:choose|over|מעל)\s+(\d+)\s*\)/i, /\b(\d+)\s+(?:choose|מעל)\s+(\d+)\b/i];
    const Cr = [/(?:בחירת|לבחור|choose|pick)\s*(\d+)\s*(?:מתוך|out of|from|מ-?)\s*(\d+)/i];
    const Pp = [/\b(?:P|nPr)\s*\(\s*(\d+)\s*,\s*(\d+)\s*\)/, /\b(\d+)\s*P\s*(\d+)\b/];
    const Pr = [/(?:לסדר|סידור|arrange)\s*(\d+)\s*(?:מתוך|out of|from|מ-?)\s*(\d+)/i];
    for (const re of C) if (!kind && (m = s.match(re))) { kind = "C"; n = +m[1]; k = +m[2]; }
    for (const re of Cr) if (!kind && (m = s.match(re))) { kind = "C"; k = +m[1]; n = +m[2]; }
    for (const re of Pp) if (!kind && (m = s.match(re))) { kind = "P"; n = +m[1]; k = +m[2]; }
    for (const re of Pr) if (!kind && (m = s.match(re))) { kind = "P"; k = +m[1]; n = +m[2]; }
    if (!kind) return null;
    if (k > n) return { problem: kind + "(" + n + "," + k + ")", answer: "0", steps: [["k > n", kind === "C" ? t("combDef") : t("permDef")]] };
    if (n > 170) fail(t("combBig"));
    let num = 1n; const top = [];
    for (let i = 0; i < k; i++) { num *= BigInt(n - i); if (top.length < 8) top.push(n - i); }
    const topS = top.join("·") + (k > 8 ? "·…" : "") || "1";
    const steps = [];
    let ans;
    if (kind === "C") {
      let den = 1n; for (let i = 2n; i <= BigInt(k); i++) den *= i;
      ans = (num / den).toString();
      steps.push(["C(" + n + "," + k + ") = " + n + "! ÷ (" + k + "!·" + (n - k) + "!)", t("combDef")]);
      steps.push(["= (" + topS + ") ÷ " + k + "! = " + num + " ÷ " + den + " = " + ans, t("rCalc")]);
    } else {
      ans = num.toString();
      steps.push(["P(" + n + "," + k + ") = " + n + "! ÷ " + (n - k) + "!", t("permDef")]);
      steps.push(["= " + topS + " = " + ans, t("rCalc")]);
    }
    return { problem: kind + "(" + n + "," + k + ")", answer: ans, steps };
  }

  // ---------- statistics ----------
  function stats(nums) {
    const NUM = x => round(x);
    const n = nums.length, sorted = nums.slice().sort((a, b) => a - b), steps = [];
    steps.push([sorted.map(NUM).join(", "), t("sortedW") + "  ·  " + t("countW") + ": " + n]);
    const sum = nums.reduce((a, b) => a + b, 0), mean = sum / n;
    steps.push(["x̄ = " + NUM(sum) + " ÷ " + n + " = " + NUM(mean), t("mean")]);
    const med = n % 2 ? sorted[(n - 1) / 2] : (sorted[n / 2 - 1] + sorted[n / 2]) / 2;
    steps.push([(n % 2 ? NUM(med) : "(" + NUM(sorted[n / 2 - 1]) + " + " + NUM(sorted[n / 2]) + ") ÷ 2 = " + NUM(med)), t("median")]);
    const cnt = new Map(); nums.forEach(x => cnt.set(x, (cnt.get(x) || 0) + 1));
    const top = Math.max(...cnt.values());
    steps.push([top > 1 ? [...cnt].filter(([, c]) => c === top).map(([x]) => NUM(x)).join(", ") + "  (×" + top + ")" : "—", top > 1 ? t("mode") : t("noMode")]);
    steps.push([NUM(sorted[n - 1]) + " − " + paren(approxRat(sorted[0])) + " = " + NUM(sorted[n - 1] - sorted[0]), t("range")]);
    const variance = nums.reduce((a, x) => a + (x - mean) ** 2, 0) / n;
    steps.push(["σ² = " + NUM(variance), t("variance")]);
    const sd = Math.sqrt(variance);
    const sdR = approxRat(sd);
    steps.push(["σ = √" + (NUM(variance).includes("/") ? "(" + NUM(variance) + ")" : NUM(variance)) + (sdR.exact ? " = " + fmt(sdR) : " ≈ " + round(sd)), t("sd")]);
    return { answer: t("meanW") + " " + iso(NUM(mean)) + " ,  " + t("medianW") + " " + iso(NUM(med)) + " ,  " + t("sdW") + " " + iso("≈ " + round(sd)), steps };
  }
  const STATW = /ממוצע|חציון|שכיח|סטיי?ת|שונות|טווח|נתונים|mean|average|median|mode|deviation|variance|statistic|\bdata\b/i;
  const SEQW = /סדר[הת]|sequence|progression|חשבונית|הנדסית|arithmetic|geometric/i;
  function listTopic(raw) {
    const s = String(raw).replace(/[−–]/g, "-");
    const body = s.replace(/[֐-׿"'״׳]+|[a-zA-Z]+/g, " ").replace(/:/g, " ");
    if (!/^[\s\d.,;\-…]*$/.test(body) || /-\s/.test(body)) return null;
    const nums = [...body.matchAll(/-?\d+(?:\.\d+)?/g)].map(m => parseFloat(m[0]));
    if (nums.length < 3 || !/[,;]/.test(body)) return null;
    const problem = nums.map(NUM).join(", ");
    if (!STATW.test(s)) { const r = seqFromList(nums); if (r) return Object.assign({ problem }, r); if (SEQW.test(s)) return null; }
    return Object.assign({ problem }, stats(nums));
  }

  // ---------- which topic? ----------
  const DERW = /נגזר|גזר[וי]|לגזור|derivativ|different|d\/dx|\b[fgy]\s*['’′]\s*(\(|=)/i;
  const INVW = /חקיר|חקור|קיצון|עליי?ה|ירידה|investigat|extrem|maxim|minim|increas|decreas|critical|stationary/i;
  const TANW = /משיק|tangent/i;
  const INTW = /אינטגר|integra|∫|antideriv|קדומה|primitive/i;
  const AREAW = /שטח|area/i;
  const NUMR = "(-?(?:\\d+(?:\\.\\d+)?(?:\\/\\d+)?|π|pi))";
  function calcParts(raw) {
    let s = String(raw).replace(/[−–]/g, "-");
    let A = null, B = null, at = null, m;
    s = s.replace(/(?:^|[^a-zA-Z])[a-zA-Z]\s*['’′]*\s*\(\s*x\s*\)\s*=/g, " ").replace(/(?:^|\s|:)y\s*['’′]?\s*=/g, " ").replace(/\b[a-zA-Z]\s*['’′]+\s*\(\s*x\s*\)/g, " ");
    if ((m = s.match(new RegExp("∫\\s*_?\\{?" + NUMR + "\\}?\\s*\\^\\{?" + NUMR + "\\}?")))) { A = m[1]; B = m[2]; s = s.replace(m[0], " "); }
    const BOUNDS = [new RegExp("(?:from|between)\\s*" + NUMR + "\\s*(?:to|and)\\s*" + NUMR, "i"),
      new RegExp("(?:מ|בין)[-־]?\\s*" + NUMR + "\\s*(?:עד|ל[-־]?|ו[-־]?)\\s*" + NUMR),
      new RegExp("\\[\\s*" + NUMR + "\\s*[,;]\\s*" + NUMR + "\\s*\\]"),
      new RegExp("(?:x\\s*=\\s*)" + NUMR + "\\s*(?:,|and|ו|עד|to)\\s*(?:x\\s*=\\s*)" + NUMR)];
    if (A === null) for (const re of BOUNDS) if ((m = s.match(re))) { A = m[1]; B = m[2]; s = s.replace(m[0], " "); break; }
    if ((m = s.match(new RegExp("\\bx\\s*=\\s*" + NUMR + "(?![\\d.]*[a-z(*^])", "i")))) { at = m[1]; s = s.replace(m[0], " "); }
    else if ((m = s.match(new RegExp("\\(\\s*" + NUMR + "\\s*[,;]\\s*" + NUMR + "\\s*\\)")))) { at = m[1]; s = s.replace(m[0], " "); }
    s = s.replace(/∫|\bdx\b|d\/dx/gi, " ").replace(/['’′]/g, " ");
    const num = x => x == null ? null : M().evaluate(String(x).replace("π", "pi"));
    return { expr: normalize(s), A: num(A), B: num(B), at: num(at) };
  }
  function calcTopic(raw) {
    const s = String(raw);
    const isF = /(?:^|[^a-zA-Z])f\s*\(\s*x\s*\)\s*=/.test(s);
    const kind = INTW.test(s) ? "int" : TANW.test(s) ? "tan" : INVW.test(s) ? "inv" : DERW.test(s) ? "der" : AREAW.test(s) && /\bx\b|x\^|x²/.test(s) && /עד|to|\[|between|בין/.test(s) ? "area" : isF ? "inv" : null;
    if (!kind) return null;
    const c = calcParts(s);
    if (!c.expr) return null;
    const node = M().parse(c.expr), vars = symbols(node);
    if (vars.length > 1) fail(t("multiVars", iso(vars.join(", "))));
    const v = vars[0] || "x";
    const problem = (kind === "int" || kind === "area" ? "∫ " : "f(" + v + ") = ") + pretty(c.expr) + (c.A != null ? "  [" + NUMP(c.A) + " , " + NUMP(c.B) + "]" : "") + (c.at != null ? "  ,  x = " + NUM(c.at) : "");
    let r;
    if (kind === "int") r = integral(c.expr, v, c.A, c.B, AREAW.test(s) && c.A != null);
    else if (kind === "area") r = integral(c.expr, v, c.A, c.B, true);
    else if (kind === "tan") r = tangent(c.expr, v, c.at);
    else if (kind === "der") r = derivative(c.expr, v, c.at);
    else r = investigate(c.expr, v);
    return { problem, answer: r.answer, steps: r.steps };
  }
  function advanced(raw) {
    const s = String(raw);
    let r = null;
    const PAIR = /\(\s*[−–-]?\d+(?:\.\d+)?\s*[,;]\s*[−–-]?\d+(?:\.\d+)?\s*\)/g;
    if ((s.match(PAIR) || []).length >= 2) r = pointsTopic(s);
    if (!r && /(?:^|\s)C\s*\(|\bP\s*\(|\d\s*[CP]\s*\d|choose|מעל|מתוך|nCr|nPr|^\s*\d+\s*!\s*$|לסדר|סידור|arrange/i.test(s)) r = combTopic(s);
    if (!r && (SEQW.test(s) || /\ba\s*_?\s*\{?\d+\}?\s*=/.test(s) && /\b[dq]\s*=|\ba\s*_?\s*\{?\d+\}?\s*=.*\ba\s*_?\s*\{?\d+\}?\s*=/.test(s)) && !/\(\s*-?\d+\s*,/.test(s)) {
      const lt = listTopic(s); if (lt) return lt;
      const g = seqGivens(s); return Object.assign({ problem: pretty(s.replace(/[֐-׿"'״׳]+/g, " ").trim()) }, g);
    }
    if (!r && /\(\s*[−–-]?\d+(?:\.\d+)?\s*[,;]\s*[−–-]?\d+(?:\.\d+)?\s*\)/.test(s)) r = pointsTopic(s);
    if (!r) r = listTopic(s);
    if (!r) r = calcTopic(s);
    return r;
  }

  // ---------- reading the text ----------
  const WORDS_OK = /^(sqrt|sin|cos|tan|abs|pi|ln|log|logb|exp)$/i;
  const COMMONW = /^(of|is|to|in|at|by|and|the|for|if|it|on|or|as|an|no|so|do|be|are|how|its|you|we|me|my|he|us|am|go|all|get|set|let|use|now|new|any|has|was|not|but|can|out|one|two|six|ten|per|cm|mm|km|kg|deg|ans|sol|ex|eq|q|hw)$/i;
  const FNW = /^(sin|cos|tan|abs|pi|log|ln|exp|logb|sqrt|frac)$/;
  function fixLogs(s) {
    s = s.replace(/log\s*([₀-₉]+)/g, (m, d) => "log_" + [...d].map(c => "₀₁₂₃₄₅₆₇₈₉".indexOf(c)).join(""));
    const tag = b => (b === "10" ? "LOGTEN" : "LOGB<" + b + ">");
    s = s.replace(/\blog\s*_\s*\{?(\d+(?:\.\d+)?)\}?\s*(?=\()/gi, (m, b) => tag(b))
      .replace(/\blog(\d+(?:\.\d+)?)\s*(?=\()/gi, (m, b) => tag(b))
      .replace(/\blog\s*_\s*\{?(\d+(?:\.\d+)?)\}?\s*([a-z0-9.]+)/gi, (m, b, a) => tag(b) + "(" + a + ")")
      .replace(/\blog\b\s*(?=\()/gi, "LOGTEN").replace(/\blog\b\s*([a-z0-9.]+)/gi, "LOGTEN($1)")
      .replace(/\bln\b\s*(?=\()/gi, "LNAT").replace(/\bln\b\s*([a-z0-9.]+)/gi, "LNAT($1)");
    let m;
    while ((m = s.match(/LOGB<([\d.]+)>\(/))) {
      const start = m.index + m[0].length; let depth = 1, j = start;
      while (j < s.length && depth) { if (s[j] === "(") depth++; else if (s[j] === ")") depth--; j++; }
      if (depth) { s = s.replace(m[0], "("); break; }
      s = s.slice(0, m.index) + "logb(" + s.slice(start, j - 1) + "," + m[1] + ")" + s.slice(j);
    }
    return s.replace(/LOGTEN/g, "log10").replace(/LNAT/g, "log");
  }
  function prettyLogs(s) {
    let m;
    while ((m = s.match(/logb\(/))) {
      const start = m.index + m[0].length; let depth = 1, j = start, comma = -1;
      while (j < s.length && depth) { if (s[j] === "(") depth++; else if (s[j] === ")") depth--; else if (s[j] === "," && depth === 1) comma = j; j++; }
      if (depth || comma < 0) break;
      s = s.slice(0, m.index) + "log" + subs(s.slice(comma + 1, j - 1)) + "(" + s.slice(start, comma) + ")" + s.slice(j);
    }
    return s.replace(/log10\(/g, "LOGTEN(").replace(/log2\(/g, "log₂(").replace(/log\(/g, "ln(").replace(/LOGTEN\(/g, "log(");
  }
  function normalize(raw) {
    let s = " " + String(raw) + " ";
    s = s.replace(/[−–—]/g, "-").replace(/[×✕·•∙]/g, "*").replace(/÷/g, "/");
    s = s.replace(/≤|⩽/g, "<=").replace(/≥|⩾/g, ">=");
    s = s.replace(/π/g, "pi");
    s = s.replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹⁻]+/g, m => "^(" + m.split("").map(c => "0123456789-"["⁰¹²³⁴⁵⁶⁷⁸⁹⁻".indexOf(c)]).join("") + ")");
    s = s.replace(/(\d+(?:\.\d+)?)\s*%\s*of\b/gi, "($1/100)*").replace(/%/g, "/100");
    s = s.replace(/[֐-׿][֐-׿"'״׳]*\s*:?/g, " ");
    s = s.replace(/\b[a-z]{2,}\b\s*:?/gi, w => { const x = w.replace(/[\s:]/g, ""); return WORDS_OK.test(x) || (x.length <= 3 && /^[a-z]+$/.test(x) && !COMMONW.test(x) && !/:/.test(w)) ? w : " "; });
    s = s.replace(/^\s*(\(?\d{1,2}[.)]|\(?[a-hA-H][.)])\s+/, " ");
    s = s.replace(/^\s*[a-z]\s*:(?=.*[=<>])/i, " ");
    s = s.replace(/^[\s:]+/, "");
    s = s.replace(/:/g, "/");
    s = s.replace(/(\d),(\d{3})(?!\d)/g, "$1$2").replace(/(\d),(\d)/g, "$1.$2");
    s = s.replace(/√\s*\(/g, "sqrt(").replace(/√\s*([0-9.]+|[a-z])/gi, "sqrt($1)");
    s = s.replace(/[?]/g, "").replace(/=\s*$/, "").replace(/[\[{]/g, "(").replace(/[\]}]/g, ")");
    if (!s.includes("=")) s = s.replace(/(\d)\s*[xX]\s*(?=\d)/g, "$1*");
    s = s.replace(/X/g, "x");
    s = fixLogs(s);
    s = s.replace(/(?<![a-z])[a-z]{2,3}(?![a-z])/g, w => (FNW.test(w) ? w : w.split("").join("*")));
    s = s.replace(/(^|[^a-z])([a-z])\s*\(/gi, "$1$2*(");   // x(x-2) means x times (x-2)
    s = s.replace(/(\d+)\s+(\d+)\/(\d+)/g, "($1+$2/$3)");
    return s.replace(/^[\s,;]+|[\s,;]+$/g, "").trim();
  }
  function pretty(s) {
    return prettyLogs(String(s).replace(/\s+/g, ""))
      .replace(/\^\((-?\d+)\)/g, "^$1")
      .replace(/(\d)\*([a-z(])/gi, "$1$2")
      .replace(/(^|[^a-z])([a-z]+)\*([a-z](?![a-z])|\()/gi, "$1$2$3").replace(/(^|[^a-z])([a-z]+)\*([a-z](?![a-z])|\()/gi, "$1$2$3").replace(/(^|[^a-z])([a-z]+)\*([a-z](?![a-z])|\()/gi, "$1$2$3")
      .replace(/sqrt\(/g, "√(").replace(/\bpi\b/g, "π")
      .replace(/\^(-?\d+)/g, (m, d) => sup(d))
      .replace(/\*/g, " · ").replace(/\//g, "/").replace(/<=/g, "≤").replace(/>=/g, "≥").replace(/=/g, " = ").replace(/([<>≤≥])/g, " $1 ").replace(/\+/g, " + ")
      .replace(/([\w)²³⁰¹⁴⁵⁶⁷⁸⁹.])-/g, "$1 − ").replace(/-/g, "−");
  }

  function tidy(r) {
    if (!r) return r;
    const fix = x => String(x).replace(/=\s*≈/g, "≈").replace(/evar/g, "e");
    if (r.answer) r.answer = fix(r.answer);
    if (r.problem) r.problem = fix(r.problem);
    if (r.steps) r.steps = r.steps.map(([c, w]) => [fix(c), w]);
    return r;
  }
  function solveOne(raw) { return tidy(solveOne_(raw)); }
  function solveOne_(raw) {
    RANGE = null;
    raw = String(raw).replace(/[−–]/g, "-");
    if (/sin|cos|tan/i.test(raw)) {
      const m = raw.match(/(-?\d+)\s*°?\s*(?:≤|<=|<)\s*[a-zα]\s*(?:≤|<=|<)\s*(-?\d+)\s*°?/i);
      if (m) { RANGE = [+m[1], +m[2]]; raw = raw.replace(m[0], " ").replace(/[\s,;]+$/, "").replace(/(?:בתחום|in|for|where|כאשר)\s*$/i, "").replace(/[\s,;]+$/, ""); }
    }
    try { const adv = advanced(raw); if (adv) return adv; }
    catch (e) { if (e.friendly) return { problem: pretty(normalize(raw)), error: e.message }; }
    let s = normalize(raw);
    if (/=/.test(s) && /(?<![a-z])e(?![a-z^(])/.test(s) && !/e\s*\^|e\*\(/.test(s) && !/(?<![a-z])(?!e\b)[a-df-z](?![a-z(])/.test(s.replace(/\b(?:sqrt|sin|cos|tan|abs|pi|log10|log2|logb|log|exp)\b/g, ""))) s = s.replace(/(?<![a-z])e(?![a-z])/g, "evar");
    if (!/[0-9]/.test(s) && !/[a-z]/i.test(s)) return null;
    const display = pretty(s);
    try {
      if (/[<>]/.test(s)) return Object.assign({ problem: display }, inequality(s));
      const parts = s.split("=");
      if (parts.length > 2) fail(t("multiEq"));
      if (parts.length === 2) {
        if (!parts[0].trim() || !parts[1].trim()) fail(t("emptySide"));
        return Object.assign({ problem: display }, equation(parts[0], parts[1]));
      }
      const fracLit = x => x.replace(/(^|[^\d.\/])(\d+)\/(\d+)(?![\d.\/])/g, "$1frac($2,$3)");
      if (/^\d+$/.test(s) && Number(s) >= 2 && Number(s) <= 1e12) return Object.assign({ problem: display }, factorize(Number(s)));
      const vars = symbols(M().parse(s));
      let r = vars.length ? algebra(s) : powers(s);
      if (!r) r = arithmetic(fracLit(s));
      return { problem: display, answer: r.answer, steps: r.steps };
    } catch (e) {
      return { problem: display, error: e.friendly ? e.message : t("generic") };
    }
  }

  function solve(text, lang) {
    LANG = MSG[lang] ? lang : "en";
    let lines = String(text).split(/\n|;/).map(x => x.trim()).filter(Boolean);
    const eqs = l => (l.match(/(?<![<>])=/g) || []).length;
    const seqLike = l => SEQW.test(l) || /\ba\s*_?\s*\{?\d+\}?\s*=/.test(l) || /[a-zA-Z]\s*['’′]*\s*\(\s*x\s*\)\s*=/.test(l) || DERW.test(l) || INVW.test(l) || TANW.test(l) || INTW.test(l);
    if (lines.length === 1 && eqs(lines[0]) === 2 && !seqLike(lines[0])) { const sp = lines[0].split(/,|\band\b|\sו(?=\s)/); if (sp.length === 2 && sp.every(x => eqs(x) === 1)) lines = sp.map(x => x.trim()); }
    if (lines.length === 2 && lines.every(l => eqs(l) === 1 && !/[<>≤≥]/.test(l) && !seqLike(l))) {
      try {
        const ns = lines.map(normalize);
        const vs = ns.map(l => new Set(l.split("=").flatMap(p => symbols(M().parse(p)))));
        const all = new Set(vs.flatMap(x => [...x]));
        if (all.size === 2 && [...all].every(x => /^[a-z]$/.test(x)) && (vs.some(x => x.size === 2) || vs.every(x => x.size >= 1))) {
          const r = system(ns) || systemNL(ns);
          if (r) return [tidy(Object.assign({ problem: ns.map(pretty).join("   ,   ") }, r))];
        }
      } catch (e) { /* treat the lines one by one */ }
    }
    return lines.map(solveOne).filter(Boolean);
  }

  const api = { solve, normalize };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.Solver = api;
})(typeof window !== "undefined" ? window : globalThis);
