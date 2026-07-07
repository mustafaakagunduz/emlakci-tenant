/** Türkçe karakter/case duyarsız karşılaştırma için normalize eder (İl/ilçe/mahalle eşleştirmede kullanılır). */
export function normalizeTurkish(value: string): string {
  return value
    .toLocaleLowerCase('tr-TR')
    .replace(/ı/g, 'i')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim();
}

/**
 * Nominatim mahalle adını "Namık Kemal Mahallesi" gibi "Mahallesi/Mahalle" ekiyle
 * döner; yerel veri setinde bu ek yok ("Namık Kemal"). Eşleştirme öncesi bu eki
 * atar, aksi halde normalizeTurkish tek başına eşleşmeyi bulamaz.
 */
export function stripNeighborhoodSuffix(value: string): string {
  return value.replace(/\s+mahallesi$|\s+mahalle$/i, '').trim();
}
