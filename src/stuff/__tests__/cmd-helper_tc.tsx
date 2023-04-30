import { getDateOnCmd } from '../cmd-helper';
const now = new Date();

describe('dateCmd', () => { 
  it('should not found any date so null', async () => {
    const dateFound = await getDateOnCmd('/event Réunion');
    expect(dateFound).toBeNull();
  });

  it('should found the date of 2nd june, 2023', async () => {
    const dateFound = await getDateOnCmd('/event rdv le 2/6/2023 à Paris');
    expect(dateFound).toEqual(new Date('2023-06-02'));
  });

  it('should found the first date of 2nd june, 2023, not the second the 15th july', async () => {
    const dateFound = await getDateOnCmd('/event rdv le 2/6/2023 à Paris, aussi une autre date le 15/7/2023');
    expect(dateFound).toEqual(new Date('2023-06-02'));
  });

  it('should found the first date of 2nd june, 2023 with year in 2 characters, not the second the 15th july', async () => {
    const dateFound = await getDateOnCmd('/event rdv le 2/6/23 à Paris, aussi une autre date le 15/7/2023');
    expect(dateFound).toEqual(new Date('2023-06-02T00:00:00.000Z'));
  });

  it('should not found any valid date, 32th no exist', async () => {
    const dateFound = await getDateOnCmd('/event Réunion le 32/08/23');
    expect(dateFound).toBeNull();
  });

  it('should found the date of the next 24th august', async () => {
    const dateFound = await getDateOnCmd('/event Réunion le 24/08');
    // current year ?
    let expected = new Date(now.getFullYear()+'-08-24T00:00:00.000Z');
    if (expected<now){
      // next year
      expected = new Date((now.getFullYear()+1)+'-08-24T00:00:00.000Z');
    }
    expect(dateFound).toEqual(expected);
  });

  it('should found the date of the next 24th august', async () => {
    const dateFound = await getDateOnCmd('/event Réunion le 24/08/');
    // current year ?
    let expected = new Date(now.getFullYear()+'-08-24T00:00:00.000Z');
    if (expected<now){
      // next year
      expected = new Date((now.getFullYear()+1)+'-08-24T00:00:00.000Z');
    }
    expect(dateFound).toEqual(expected);
  });

  it('should not found any valid date, 32th no exist', async () => {
    const dateFound = await getDateOnCmd('/event Réunion le 32/08');
    expect(dateFound).toBeNull();
  });

  it('should not found any valid date, alpha in place of day', async () => {
    const dateFound = await getDateOnCmd('/event Réunion le aa/08/2023');
    expect(dateFound).toBeNull();
  });

  it('should not found any date, no day', async () => {
    const dateFound = await getDateOnCmd('/event Réunion en 08/2023');
    expect(dateFound).toBeNull();
  });
  
  it('should found the date of 2nd june, 2023 (with event id)', async () => {
    const dateFound = await getDateOnCmd('/date 5 2/6/2023');
    expect(dateFound).toEqual(new Date('2023-06-02'));
  });

  it('should found the date of the next 24th august (with event id)', async () => {
    const dateFound = await getDateOnCmd('/date 5 24/08');
    // current year ?
    let expected = new Date(now.getFullYear()+'-08-24T00:00:00.000Z');
    if (expected<now){
      // next year
      expected = new Date((now.getFullYear()+1)+'-08-24T00:00:00.000Z');
    }
    expect(dateFound).toEqual(expected);
  });
});