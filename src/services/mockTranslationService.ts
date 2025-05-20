export const mockTranslateUserContent = async (): Promise<string> => {
  await new Promise(resolve => setTimeout(resolve, 1000));
  return "This is a mock translation result. The actual translation service is currently being implemented.";
}; 