export async function translateCity(
	city: string,
	getTran: (key: string) => string | Promise<string>
) {
	const bn_index = city.indexOf("骨干网");
	if (bn_index !== -1) {
		return city.substr(0, bn_index) + (await getTran("骨干网"));
	}
	if (city.indexOf(".") !== -1) {
		// 域名类型，直接返回
		return city;
	}
	return getTran(city);
}
