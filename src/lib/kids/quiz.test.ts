import { describe, expect, it } from "vitest";
import {
  collectQuizAnswers,
  gradeQuizAnswer,
  parseCustomQuestion,
  quizChoiceLabel,
  quizChoiceOptions,
  quizOptionsText,
  scoreQuizResponses,
  teacherGradeToCorrect,
} from "./quiz";

describe("gradeQuizAnswer", () => {
  it("marks matching multiple choice as correct", () => {
    expect(
      gradeQuizAnswer({
        questionType: "multiple_choice",
        correctAnswer: "Goliath",
        submitted: "goliath",
      })
    ).toBe(true);
  });

  it("marks a wrong true/false answer as incorrect", () => {
    expect(
      gradeQuizAnswer({
        questionType: "true_false",
        correctAnswer: "true",
        submitted: "false",
      })
    ).toBe(false);
  });

  it("leaves short answers ungraded", () => {
    expect(
      gradeQuizAnswer({
        questionType: "short_answer",
        correctAnswer: null,
        submitted: "courage",
      })
    ).toBe(null);
  });
});

describe("quizChoiceOptions", () => {
  it("uses listed options when present", () => {
    expect(quizChoiceOptions("multiple_choice", ["Goliath", "Pharaoh"])).toEqual([
      "Goliath",
      "Pharaoh",
    ]);
  });

  it("falls back to true/false", () => {
    expect(quizChoiceOptions("true_false", null)).toEqual(["true", "false"]);
  });
});

describe("quizChoiceLabel", () => {
  it("capitalizes true/false", () => {
    expect(quizChoiceLabel("true_false", "true")).toBe("True");
  });
});

describe("scoreQuizResponses", () => {
  it("counts only auto-graded rows", () => {
    expect(
      scoreQuizResponses([
        { is_correct: true },
        { is_correct: false },
        { is_correct: null },
      ])
    ).toEqual({ correct: 1, graded: 2, total: 3 });
  });
});

describe("collectQuizAnswers", () => {
  it("collects answers and reports missing ones", () => {
    const form = new FormData();
    form.set("answer-q1", "Goliath");
    form.set("answer-q2", "   ");
    const result = collectQuizAnswers(form, ["q1", "q2"]);
    expect(result.answers.get("q1")).toBe("Goliath");
    expect(result.missing).toEqual(["q2"]);
  });
});

describe("parseCustomQuestion", () => {
  it("parses multiple choice choices", () => {
    const result = parseCustomQuestion({
      questionText: "Who did David face?",
      questionType: "multiple_choice",
      optionsText: "Goliath\nPharaoh",
      correctAnswer: "Goliath",
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.question.options).toEqual(["Goliath", "Pharaoh"]);
    }
  });

  it("rejects a correct answer that is not a choice", () => {
    const result = parseCustomQuestion({
      questionText: "Who did David face?",
      questionType: "multiple_choice",
      optionsText: "Goliath\nPharaoh",
      correctAnswer: "Saul",
    });
    expect(result.ok).toBe(false);
  });
});

describe("teacherGradeToCorrect", () => {
  it("maps grades onto is_correct", () => {
    expect(teacherGradeToCorrect("correct")).toBe(true);
    expect(teacherGradeToCorrect("incorrect")).toBe(false);
    expect(teacherGradeToCorrect("partial")).toBe(null);
  });
});

describe("quizOptionsText", () => {
  it("joins listed choices", () => {
    expect(quizOptionsText(["Goliath", "Pharaoh"])).toBe("Goliath\nPharaoh");
  });
});
