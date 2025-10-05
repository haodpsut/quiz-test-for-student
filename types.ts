
export interface QuizQuestion {
  questionText: string;
  answerOptions: string[];
  correctAnswer: string;
  explanationText: string;
}

export enum QuizStatus {
  NOT_STARTED = 'NOT_STARTED',
  LOADING = 'LOADING',
  IN_PROGRESS = 'IN_PROGRESS',
  FINISHED = 'FINISHED'
}
