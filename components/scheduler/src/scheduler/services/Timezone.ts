import { TimezoneFields } from '../types/scheduler-types';

/**
 * Timezone utility class for handling IANA timezone conversions and offsets.
 * All methods are static and work with UTC dates.
 */
export class Timezone {
    /**
     * Common IANA timezone identifiers for the timezone selector.
     */
    public static readonly timezoneData: TimezoneFields[] = [
        { value: 'Pacific/Midway', text: '(UTC-11:00) Midway' },
        { value: 'Pacific/Niue', text: '(UTC-11:00) Niue' },
        { value: 'Pacific/Pago_Pago', text: '(UTC-11:00) Pago Pago' },
        { value: 'Pacific/Honolulu', text: '(UTC-10:00) Honolulu' },
        { value: 'Pacific/Rarotonga', text: '(UTC-10:00) Rarotonga' },
        { value: 'Pacific/Tahiti', text: '(UTC-10:00) Tahiti' },
        { value: 'America/Adak', text: '(UTC-10:00) Adak' },
        { value: 'Pacific/Gambier', text: '(UTC-09:00) Gambier' },
        { value: 'America/Anchorage', text: '(UTC-09:00) Anchorage' },
        { value: 'America/Juneau', text: '(UTC-09:00) Juneau' },
        { value: 'America/Metlakatla', text: '(UTC-09:00) Metlakatla' },
        { value: 'America/Nome', text: '(UTC-09:00) Nome' },
        { value: 'America/Sitka', text: '(UTC-09:00) Sitka' },
        { value: 'America/Yakutat', text: '(UTC-09:00) Yakutat' },
        { value: 'Pacific/Marquesas', text: '(UTC-09:30) Marquesas' },
        { value: 'America/Los_Angeles', text: '(UTC-08:00) Los Angeles' },
        { value: 'America/Tijuana', text: '(UTC-08:00) Tijuana' },
        { value: 'America/Vancouver', text: '(UTC-08:00) Vancouver' },
        { value: 'Pacific/Pitcairn', text: '(UTC-08:00) Pitcairn' },
        { value: 'America/Boise', text: '(UTC-07:00) Boise' },
        { value: 'America/Cambridge_Bay', text: '(UTC-07:00) Cambridge Bay' },
        { value: 'America/Ciudad_Juarez', text: '(UTC-07:00) Ciudad Juarez' },
        { value: 'America/Creston', text: '(UTC-07:00) Creston' },
        { value: 'America/Dawson', text: '(UTC-07:00) Dawson' },
        { value: 'America/Dawson_Creek', text: '(UTC-07:00) Dawson Creek' },
        { value: 'America/Denver', text: '(UTC-07:00) Denver' },
        { value: 'America/Edmonton', text: '(UTC-07:00) Edmonton' },
        { value: 'America/Fort_Nelson', text: '(UTC-07:00) Fort Nelson' },
        { value: 'America/Hermosillo', text: '(UTC-07:00) Hermosillo' },
        { value: 'America/Inuvik', text: '(UTC-07:00) Inuvik' },
        { value: 'America/Mazatlan', text: '(UTC-07:00) Mazatlan' },
        { value: 'America/Phoenix', text: '(UTC-07:00) Phoenix' },
        { value: 'America/Whitehorse', text: '(UTC-07:00) Whitehorse' },
        { value: 'America/Bahia_Banderas', text: '(UTC-06:00) Bahia Banderas' },
        { value: 'America/Belize', text: '(UTC-06:00) Belize' },
        { value: 'America/Chicago', text: '(UTC-06:00) Chicago' },
        { value: 'America/Chihuahua', text: '(UTC-06:00) Chihuahua' },
        { value: 'America/Costa_Rica', text: '(UTC-06:00) Costa Rica' },
        { value: 'America/El_Salvador', text: '(UTC-06:00) El Salvador' },
        { value: 'America/Guatemala', text: '(UTC-06:00) Guatemala' },
        { value: 'America/Indiana/Knox', text: '(UTC-06:00) Knox' },
        { value: 'America/Indiana/Tell_City', text: '(UTC-06:00) Tell City' },
        { value: 'America/Managua', text: '(UTC-06:00) Managua' },
        { value: 'America/Matamoros', text: '(UTC-06:00) Matamoros' },
        { value: 'America/Menominee', text: '(UTC-06:00) Menominee' },
        { value: 'America/Merida', text: '(UTC-06:00) Merida' },
        { value: 'America/Mexico_City', text: '(UTC-06:00) Mexico City' },
        { value: 'America/Monterrey', text: '(UTC-06:00) Monterrey' },
        { value: 'America/North_Dakota/Beulah', text: '(UTC-06:00) Beulah' },
        { value: 'America/North_Dakota/Center', text: '(UTC-06:00) Center' },
        { value: 'America/North_Dakota/New_Salem', text: '(UTC-06:00) New Salem' },
        { value: 'America/Ojinaga', text: '(UTC-06:00) Ojinaga' },
        { value: 'America/Rankin_Inlet', text: '(UTC-06:00) Rankin Inlet' },
        { value: 'America/Regina', text: '(UTC-06:00) Regina' },
        { value: 'America/Resolute', text: '(UTC-06:00) Resolute' },
        { value: 'America/Swift_Current', text: '(UTC-06:00) Swift Current' },
        { value: 'America/Tegucigalpa', text: '(UTC-06:00) Tegucigalpa' },
        { value: 'America/Winnipeg', text: '(UTC-06:00) Winnipeg' },
        { value: 'Pacific/Easter', text: '(UTC-06:00) Easter' },
        { value: 'Pacific/Galapagos', text: '(UTC-06:00) Galapagos' },
        { value: 'America/Atikokan', text: '(UTC-05:00) Atikokan' },
        { value: 'America/Bogota', text: '(UTC-05:00) Bogota' },
        { value: 'America/Cancun', text: '(UTC-05:00) Cancun' },
        { value: 'America/Cayman', text: '(UTC-05:00) Cayman' },
        { value: 'America/Detroit', text: '(UTC-05:00) Detroit' },
        { value: 'America/Eirunepe', text: '(UTC-05:00) Eirunepe' },
        { value: 'America/Grand_Turk', text: '(UTC-05:00) Grand Turk' },
        { value: 'America/Guayaquil', text: '(UTC-05:00) Guayaquil' },
        { value: 'America/Havana', text: '(UTC-05:00) Havana' },
        { value: 'America/Indiana/Indianapolis', text: '(UTC-05:00) Indianapolis' },
        { value: 'America/Indiana/Marengo', text: '(UTC-05:00) Marengo' },
        { value: 'America/Indiana/Petersburg', text: '(UTC-05:00) Petersburg' },
        { value: 'America/Indiana/Vevay', text: '(UTC-05:00) Vevay' },
        { value: 'America/Indiana/Vincennes', text: '(UTC-05:00) Vincennes' },
        { value: 'America/Indiana/Winamac', text: '(UTC-05:00) Winamac' },
        { value: 'America/Iqaluit', text: '(UTC-05:00) Iqaluit' },
        { value: 'America/Jamaica', text: '(UTC-05:00) Jamaica' },
        { value: 'America/Nassau', text: '(UTC-05:00) Nassau' },
        { value: 'America/Kentucky/Louisville', text: '(UTC-05:00) Louisville' },
        { value: 'America/Kentucky/Monticello', text: '(UTC-05:00) Monticello' },
        { value: 'America/Lima', text: '(UTC-05:00) Lima' },
        { value: 'America/New_York', text: '(UTC-05:00) New York' },
        { value: 'America/Panama', text: '(UTC-05:00) Panama' },
        { value: 'America/Port-au-Prince', text: '(UTC-05:00) Port-au-Prince' },
        { value: 'America/Rio_Branco', text: '(UTC-05:00) Rio Branco' },
        { value: 'America/Toronto', text: '(UTC-05:00) Toronto' },
        { value: 'America/Anguilla', text: '(UTC-04:00) Anguilla' },
        { value: 'America/Antigua', text: '(UTC-04:00) Antigua' },
        { value: 'America/Aruba', text: '(UTC-04:00) Aruba' },
        { value: 'America/Barbados', text: '(UTC-04:00) Barbados' },
        { value: 'America/Blanc-Sablon', text: '(UTC-04:00) Blanc-Sablon' },
        { value: 'America/Boa_Vista', text: '(UTC-04:00) Boa Vista' },
        { value: 'America/Campo_Grande', text: '(UTC-04:00) Campo Grande' },
        { value: 'America/Caracas', text: '(UTC-04:00) Caracas' },
        { value: 'America/Cuiaba', text: '(UTC-04:00) Cuiaba' },
        { value: 'America/Curacao', text: '(UTC-04:00) Curacao' },
        { value: 'America/Dominica', text: '(UTC-04:00) Dominica' },
        { value: 'America/Glace_Bay', text: '(UTC-04:00) Glace Bay' },
        { value: 'America/Goose_Bay', text: '(UTC-04:00) Goose Bay' },
        { value: 'America/Grenada', text: '(UTC-04:00) Grenada' },
        { value: 'America/Guadeloupe', text: '(UTC-04:00) Guadeloupe' },
        { value: 'America/Guyana', text: '(UTC-04:00) Guyana' },
        { value: 'America/Halifax', text: '(UTC-04:00) Halifax' },
        { value: 'America/Kralendijk', text: '(UTC-04:00) Kralendijk' },
        { value: 'America/La_Paz', text: '(UTC-04:00) La Paz' },
        { value: 'America/Lower_Princes', text: '(UTC-04:00) Lower Princes' },
        { value: 'America/Manaus', text: '(UTC-04:00) Manaus' },
        { value: 'America/Marigot', text: '(UTC-04:00) Marigot' },
        { value: 'America/Martinique', text: '(UTC-04:00) Martinique' },
        { value: 'America/Moncton', text: '(UTC-04:00) Moncton' },
        { value: 'America/Montserrat', text: '(UTC-04:00) Montserrat' },
        { value: 'America/Port_of_Spain', text: '(UTC-04:00) Port of Spain' },
        { value: 'America/Porto_Velho', text: '(UTC-04:00) Porto Velho' },
        { value: 'America/Puerto_Rico', text: '(UTC-04:00) Puerto Rico' },
        { value: 'America/Santiago', text: '(UTC-04:00) Santiago' },
        { value: 'America/Santo_Domingo', text: '(UTC-04:00) Santo Domingo' },
        { value: 'America/St_Barthelemy', text: '(UTC-04:00) St Barthelemy' },
        { value: 'America/St_Kitts', text: '(UTC-04:00) St Kitts' },
        { value: 'America/St_Lucia', text: '(UTC-04:00) St Lucia' },
        { value: 'America/St_Thomas', text: '(UTC-04:00) St Thomas' },
        { value: 'America/St_Vincent', text: '(UTC-04:00) St Vincent' },
        { value: 'America/Thule', text: '(UTC-04:00) Thule' },
        { value: 'America/Tortola', text: '(UTC-04:00) Tortola' },
        { value: 'Atlantic/Bermuda', text: '(UTC-04:00) Bermuda' },
        { value: 'America/Araguaina', text: '(UTC-03:00) Araguaina' },
        { value: 'America/Argentina/Buenos_Aires', text: '(UTC-03:00) Buenos Aires' },
        { value: 'America/Argentina/Catamarca', text: '(UTC-03:00) Catamarca' },
        { value: 'America/Argentina/Cordoba', text: '(UTC-03:00) Cordoba' },
        { value: 'America/Argentina/Jujuy', text: '(UTC-03:00) Jujuy' },
        { value: 'America/Argentina/La_Rioja', text: '(UTC-03:00) La Rioja' },
        { value: 'America/Argentina/Mendoza', text: '(UTC-03:00) Mendoza' },
        { value: 'America/Argentina/Rio_Gallegos', text: '(UTC-03:00) Rio Gallegos' },
        { value: 'America/Argentina/Salta', text: '(UTC-03:00) Salta' },
        { value: 'America/Argentina/San_Juan', text: '(UTC-03:00) San Juan' },
        { value: 'America/Argentina/San_Luis', text: '(UTC-03:00) San Luis' },
        { value: 'America/Argentina/Tucuman', text: '(UTC-03:00) Tucuman' },
        { value: 'America/Argentina/Ushuaia', text: '(UTC-03:00) Ushuaia' },
        { value: 'America/Asuncion', text: '(UTC-03:00) Asuncion' },
        { value: 'America/Bahia', text: '(UTC-03:00) Bahia' },
        { value: 'America/Belem', text: '(UTC-03:00) Belem' },
        { value: 'America/Cayenne', text: '(UTC-03:00) Cayenne' },
        { value: 'America/Coyhaique', text: '(UTC-03:00) Coyhaique' },
        { value: 'America/Fortaleza', text: '(UTC-03:00) Fortaleza' },
        { value: 'America/Maceio', text: '(UTC-03:00) Maceio' },
        { value: 'America/Paramaribo', text: '(UTC-03:00) Paramaribo' },
        { value: 'America/Punta_Arenas', text: '(UTC-03:00) Punta Arenas' },
        { value: 'America/Recife', text: '(UTC-03:00) Recife' },
        { value: 'America/Santarem', text: '(UTC-03:00) Santarem' },
        { value: 'America/Sao_Paulo', text: '(UTC-03:00) Sao Paulo' },
        { value: 'Antarctica/Palmer', text: '(UTC-03:00) Palmer' },
        { value: 'Antarctica/Rothera', text: '(UTC-03:00) Rothera' },
        { value: 'Atlantic/Stanley', text: '(UTC-03:00) Stanley' },
        { value: 'America/Montevideo', text: '(UTC-03:00) Montevideo' },
        { value: 'America/Miquelon', text: '(UTC-03:00) Miquelon' },
        { value: 'America/St_Johns', text: '(UTC-03:30) St Johns' },
        { value: 'America/Noronha', text: '(UTC-02:00) Noronha' },
        { value: 'Atlantic/South_Georgia', text: '(UTC-02:00) South Georgia' },
        { value: 'America/Nuuk', text: '(UTC-02:00) Nuuk' },
        { value: 'America/Scoresbysund', text: '(UTC-02:00) Scoresbysund' },
        { value: 'Atlantic/Azores', text: '(UTC-01:00) Azores' },
        { value: 'Atlantic/Cape_Verde', text: '(UTC-01:00) Cape Verde' },
        { value: 'UTC', text: '(UTC+00:00) UTC' },
        { value: 'Africa/Abidjan', text: '(UTC+00:00) Abidjan' },
        { value: 'Africa/Accra', text: '(UTC+00:00) Accra' },
        { value: 'Africa/Bamako', text: '(UTC+00:00) Bamako' },
        { value: 'Africa/Banjul', text: '(UTC+00:00) Banjul' },
        { value: 'Africa/Bissau', text: '(UTC+00:00) Bissau' },
        { value: 'Africa/Conakry', text: '(UTC+00:00) Conakry' },
        { value: 'Africa/Dakar', text: '(UTC+00:00) Dakar' },
        { value: 'Africa/Freetown', text: '(UTC+00:00) Freetown' },
        { value: 'Africa/Lome', text: '(UTC+00:00) Lome' },
        { value: 'Africa/Monrovia', text: '(UTC+00:00) Monrovia' },
        { value: 'Africa/Nouakchott', text: '(UTC+00:00) Nouakchott' },
        { value: 'Africa/Ouagadougou', text: '(UTC+00:00) Ouagadougou' },
        { value: 'Africa/Sao_Tome', text: '(UTC+00:00) Sao Tome' },
        { value: 'America/Danmarkshavn', text: '(UTC+00:00) Danmarkshavn' },
        { value: 'Antarctica/Troll', text: '(UTC+00:00) Troll' },
        { value: 'Atlantic/Canary', text: '(UTC+00:00) Canary' },
        { value: 'Atlantic/Faroe', text: '(UTC+00:00) Faroe' },
        { value: 'Atlantic/Madeira', text: '(UTC+00:00) Madeira' },
        { value: 'Atlantic/Reykjavik', text: '(UTC+00:00) Reykjavik' },
        { value: 'Atlantic/St_Helena', text: '(UTC+00:00) St Helena' },
        { value: 'Europe/Dublin', text: '(UTC+00:00) Dublin' },
        { value: 'Europe/Guernsey', text: '(UTC+00:00) Guernsey' },
        { value: 'Europe/Isle_of_Man', text: '(UTC+00:00) Isle of Man' },
        { value: 'Europe/Jersey', text: '(UTC+00:00) Jersey' },
        { value: 'Europe/Lisbon', text: '(UTC+00:00) Lisbon' },
        { value: 'Europe/London', text: '(UTC+00:00) London' },
        { value: 'Africa/Bangui', text: '(UTC+01:00) Bangui' },
        { value: 'Africa/Brazzaville', text: '(UTC+01:00) Brazzaville' },
        { value: 'Africa/Casablanca', text: '(UTC+01:00) Casablanca' },
        { value: 'Africa/Ceuta', text: '(UTC+01:00) Ceuta' },
        { value: 'Africa/Douala', text: '(UTC+01:00) Douala' },
        { value: 'Africa/El_Aaiun', text: '(UTC+01:00) El Aaiun' },
        { value: 'Africa/Kinshasa', text: '(UTC+01:00) Kinshasa' },
        { value: 'Africa/Lagos', text: '(UTC+01:00) Lagos' },
        { value: 'Africa/Libreville', text: '(UTC+01:00) Libreville' },
        { value: 'Africa/Luanda', text: '(UTC+01:00) Luanda' },
        { value: 'Africa/Malabo', text: '(UTC+01:00) Malabo' },
        { value: 'Africa/Ndjamena', text: '(UTC+01:00) Ndjamena' },
        { value: 'Africa/Niamey', text: '(UTC+01:00) Niamey' },
        { value: 'Africa/Porto-Novo', text: '(UTC+01:00) Porto-Novo' },
        { value: 'Africa/Tunis', text: '(UTC+01:00) Tunis' },
        { value: 'Africa/Algiers', text: '(UTC+01:00) Algiers' },
        { value: 'Arctic/Longyearbyen', text: '(UTC+01:00) Longyearbyen' },
        { value: 'Europe/Amsterdam', text: '(UTC+01:00) Amsterdam' },
        { value: 'Europe/Andorra', text: '(UTC+01:00) Andorra' },
        { value: 'Europe/Belgrade', text: '(UTC+01:00) Belgrade' },
        { value: 'Europe/Berlin', text: '(UTC+01:00) Berlin' },
        { value: 'Europe/Bratislava', text: '(UTC+01:00) Bratislava' },
        { value: 'Europe/Brussels', text: '(UTC+01:00) Brussels' },
        { value: 'Europe/Budapest', text: '(UTC+01:00) Budapest' },
        { value: 'Europe/Busingen', text: '(UTC+01:00) Busingen' },
        { value: 'Europe/Copenhagen', text: '(UTC+01:00) Copenhagen' },
        { value: 'Europe/Gibraltar', text: '(UTC+01:00) Gibraltar' },
        { value: 'Europe/Ljubljana', text: '(UTC+01:00) Ljubljana' },
        { value: 'Europe/Luxembourg', text: '(UTC+01:00) Luxembourg' },
        { value: 'Europe/Madrid', text: '(UTC+01:00) Madrid' },
        { value: 'Europe/Malta', text: '(UTC+01:00) Malta' },
        { value: 'Europe/Monaco', text: '(UTC+01:00) Monaco' },
        { value: 'Europe/Oslo', text: '(UTC+01:00) Oslo' },
        { value: 'Europe/Paris', text: '(UTC+01:00) Paris' },
        { value: 'Europe/Podgorica', text: '(UTC+01:00) Podgorica' },
        { value: 'Europe/Prague', text: '(UTC+01:00) Prague' },
        { value: 'Europe/Rome', text: '(UTC+01:00) Rome' },
        { value: 'Europe/San_Marino', text: '(UTC+01:00) San Marino' },
        { value: 'Europe/Sarajevo', text: '(UTC+01:00) Sarajevo' },
        { value: 'Europe/Skopje', text: '(UTC+01:00) Skopje' },
        { value: 'Europe/Stockholm', text: '(UTC+01:00) Stockholm' },
        { value: 'Europe/Tirane', text: '(UTC+01:00) Tirane' },
        { value: 'Europe/Vaduz', text: '(UTC+01:00) Vaduz' },
        { value: 'Europe/Vatican', text: '(UTC+01:00) Vatican' },
        { value: 'Europe/Vienna', text: '(UTC+01:00) Vienna' },
        { value: 'Europe/Warsaw', text: '(UTC+01:00) Warsaw' },
        { value: 'Europe/Zagreb', text: '(UTC+01:00) Zagreb' },
        { value: 'Europe/Zurich', text: '(UTC+01:00) Zurich' },
        { value: 'Africa/Blantyre', text: '(UTC+02:00) Blantyre' },
        { value: 'Africa/Bujumbura', text: '(UTC+02:00) Bujumbura' },
        { value: 'Africa/Cairo', text: '(UTC+02:00) Cairo' },
        { value: 'Africa/Gaborone', text: '(UTC+02:00) Gaborone' },
        { value: 'Africa/Harare', text: '(UTC+02:00) Harare' },
        { value: 'Africa/Johannesburg', text: '(UTC+02:00) Johannesburg' },
        { value: 'Africa/Juba', text: '(UTC+02:00) Juba' },
        { value: 'Africa/Khartoum', text: '(UTC+02:00) Khartoum' },
        { value: 'Africa/Kigali', text: '(UTC+02:00) Kigali' },
        { value: 'Africa/Lubumbashi', text: '(UTC+02:00) Lubumbashi' },
        { value: 'Africa/Lusaka', text: '(UTC+02:00) Lusaka' },
        { value: 'Africa/Maputo', text: '(UTC+02:00) Maputo' },
        { value: 'Africa/Maseru', text: '(UTC+02:00) Maseru' },
        { value: 'Africa/Mbabane', text: '(UTC+02:00) Mbabane' },
        { value: 'Africa/Tripoli', text: '(UTC+02:00) Tripoli' },
        { value: 'Africa/Windhoek', text: '(UTC+02:00) Windhoek' },
        { value: 'Asia/Beirut', text: '(UTC+02:00) Beirut' },
        { value: 'Asia/Famagusta', text: '(UTC+02:00) Famagusta' },
        { value: 'Asia/Gaza', text: '(UTC+02:00) Gaza' },
        { value: 'Asia/Hebron', text: '(UTC+02:00) Hebron' },
        { value: 'Asia/Jerusalem', text: '(UTC+02:00) Jerusalem' },
        { value: 'Asia/Nicosia', text: '(UTC+02:00) Nicosia' },
        { value: 'Europe/Athens', text: '(UTC+02:00) Athens' },
        { value: 'Europe/Bucharest', text: '(UTC+02:00) Bucharest' },
        { value: 'Europe/Chisinau', text: '(UTC+02:00) Chisinau' },
        { value: 'Europe/Helsinki', text: '(UTC+02:00) Helsinki' },
        { value: 'Europe/Kaliningrad', text: '(UTC+02:00) Kaliningrad' },
        { value: 'Europe/Kyiv', text: '(UTC+02:00) Kyiv' },
        { value: 'Europe/Mariehamn', text: '(UTC+02:00) Mariehamn' },
        { value: 'Europe/Riga', text: '(UTC+02:00) Riga' },
        { value: 'Europe/Sofia', text: '(UTC+02:00) Sofia' },
        { value: 'Europe/Tallinn', text: '(UTC+02:00) Tallinn' },
        { value: 'Europe/Vilnius', text: '(UTC+02:00) Vilnius' },
        { value: 'Africa/Addis_Ababa', text: '(UTC+03:00) Addis Ababa' },
        { value: 'Africa/Asmara', text: '(UTC+03:00) Asmara' },
        { value: 'Africa/Dar_es_Salaam', text: '(UTC+03:00) Dar es Salaam' },
        { value: 'Africa/Djibouti', text: '(UTC+03:00) Djibouti' },
        { value: 'Africa/Kampala', text: '(UTC+03:00) Kampala' },
        { value: 'Africa/Mogadishu', text: '(UTC+03:00) Mogadishu' },
        { value: 'Africa/Nairobi', text: '(UTC+03:00) Nairobi' },
        { value: 'Antarctica/Syowa', text: '(UTC+03:00) Syowa' },
        { value: 'Asia/Aden', text: '(UTC+03:00) Aden' },
        { value: 'Asia/Amman', text: '(UTC+03:00) Amman' },
        { value: 'Asia/Baghdad', text: '(UTC+03:00) Baghdad' },
        { value: 'Asia/Bahrain', text: '(UTC+03:00) Bahrain' },
        { value: 'Asia/Damascus', text: '(UTC+03:00) Damascus' },
        { value: 'Asia/Kuwait', text: '(UTC+03:00) Kuwait' },
        { value: 'Asia/Qatar', text: '(UTC+03:00) Qatar' },
        { value: 'Asia/Riyadh', text: '(UTC+03:00) Riyadh' },
        { value: 'Europe/Istanbul', text: '(UTC+03:00) Istanbul' },
        { value: 'Europe/Kirov', text: '(UTC+03:00) Kirov' },
        { value: 'Europe/Minsk', text: '(UTC+03:00) Minsk' },
        { value: 'Europe/Moscow', text: '(UTC+03:00) Moscow' },
        { value: 'Europe/Simferopol', text: '(UTC+03:00) Simferopol' },
        { value: 'Europe/Volgograd', text: '(UTC+03:00) Volgograd' },
        { value: 'Indian/Antananarivo', text: '(UTC+03:00) Antananarivo' },
        { value: 'Indian/Comoro', text: '(UTC+03:00) Comoro' },
        { value: 'Indian/Mayotte', text: '(UTC+03:00) Mayotte' },
        { value: 'Asia/Tehran', text: '(UTC+03:30) Tehran' },
        { value: 'Asia/Baku', text: '(UTC+04:00) Baku' },
        { value: 'Asia/Dubai', text: '(UTC+04:00) Dubai' },
        { value: 'Asia/Muscat', text: '(UTC+04:00) Muscat' },
        { value: 'Asia/Tbilisi', text: '(UTC+04:00) Tbilisi' },
        { value: 'Asia/Yerevan', text: '(UTC+04:00) Yerevan' },
        { value: 'Europe/Astrakhan', text: '(UTC+04:00) Astrakhan' },
        { value: 'Europe/Samara', text: '(UTC+04:00) Samara' },
        { value: 'Europe/Saratov', text: '(UTC+04:00) Saratov' },
        { value: 'Europe/Ulyanovsk', text: '(UTC+04:00) Ulyanovsk' },
        { value: 'Indian/Mahe', text: '(UTC+04:00) Mahe' },
        { value: 'Indian/Mauritius', text: '(UTC+04:00) Mauritius' },
        { value: 'Indian/Reunion', text: '(UTC+04:00) Reunion' },
        { value: 'Asia/Kabul', text: '(UTC+04:30) Kabul' },
        { value: 'Antarctica/Mawson', text: '(UTC+05:00) Mawson' },
        { value: 'Asia/Almaty', text: '(UTC+05:00) Almaty' },
        { value: 'Asia/Aqtau', text: '(UTC+05:00) Aqtau' },
        { value: 'Asia/Aqtobe', text: '(UTC+05:00) Aqtobe' },
        { value: 'Asia/Ashgabat', text: '(UTC+05:00) Ashgabat' },
        { value: 'Asia/Atyrau', text: '(UTC+05:00) Atyrau' },
        { value: 'Asia/Dushanbe', text: '(UTC+05:00) Dushanbe' },
        { value: 'Asia/Karachi', text: '(UTC+05:00) Karachi' },
        { value: 'Asia/Oral', text: '(UTC+05:00) Oral' },
        { value: 'Asia/Qostanay', text: '(UTC+05:00) Qostanay' },
        { value: 'Asia/Qyzylorda', text: '(UTC+05:00) Qyzylorda' },
        { value: 'Asia/Samarkand', text: '(UTC+05:00) Samarkand' },
        { value: 'Asia/Tashkent', text: '(UTC+05:00) Tashkent' },
        { value: 'Asia/Yekaterinburg', text: '(UTC+05:00) Yekaterinburg' },
        { value: 'Antarctica/Vostok', text: '(UTC+05:00) Vostok' },
        { value: 'Indian/Kerguelen', text: '(UTC+05:00) Kerguelen' },
        { value: 'Indian/Maldives', text: '(UTC+05:00) Maldives' },
        { value: 'Asia/Colombo', text: '(UTC+05:30) Colombo' },
        { value: 'Asia/Kolkata', text: '(UTC+05:30) Kolkata' },
        { value: 'Asia/Kathmandu', text: '(UTC+05:45) Kathmandu' },
        { value: 'Indian/Chagos', text: '(UTC+06:00) Chagos' },
        { value: 'Asia/Bishkek', text: '(UTC+06:00) Bishkek' },
        { value: 'Asia/Dhaka', text: '(UTC+06:00) Dhaka' },
        { value: 'Asia/Omsk', text: '(UTC+06:00) Omsk' },
        { value: 'Asia/Thimphu', text: '(UTC+06:00) Thimphu' },
        { value: 'Asia/Urumqi', text: '(UTC+06:00) Urumqi' },
        { value: 'Indian/Cocos', text: '(UTC+06:30) Cocos' },
        { value: 'Asia/Yangon', text: '(UTC+06:30) Yangon' },
        { value: 'Antarctica/Davis', text: '(UTC+07:00) Davis' },
        { value: 'Asia/Bangkok', text: '(UTC+07:00) Bangkok' },
        { value: 'Asia/Barnaul', text: '(UTC+07:00) Barnaul' },
        { value: 'Asia/Ho_Chi_Minh', text: '(UTC+07:00) Ho Chi Minh' },
        { value: 'Asia/Hovd', text: '(UTC+07:00) Hovd' },
        { value: 'Asia/Jakarta', text: '(UTC+07:00) Jakarta' },
        { value: 'Asia/Krasnoyarsk', text: '(UTC+07:00) Krasnoyarsk' },
        { value: 'Asia/Novokuznetsk', text: '(UTC+07:00) Novokuznetsk' },
        { value: 'Asia/Novosibirsk', text: '(UTC+07:00) Novosibirsk' },
        { value: 'Asia/Phnom_Penh', text: '(UTC+07:00) Phnom Penh' },
        { value: 'Asia/Pontianak', text: '(UTC+07:00) Pontianak' },
        { value: 'Asia/Tomsk', text: '(UTC+07:00) Tomsk' },
        { value: 'Asia/Vientiane', text: '(UTC+07:00) Vientiane' },
        { value: 'Indian/Christmas', text: '(UTC+07:00) Christmas' },
        { value: 'Antarctica/Casey', text: '(UTC+08:00) Casey' },
        { value: 'Asia/Brunei', text: '(UTC+08:00) Brunei' },
        { value: 'Asia/Hong_Kong', text: '(UTC+08:00) Hong Kong' },
        { value: 'Asia/Irkutsk', text: '(UTC+08:00) Irkutsk' },
        { value: 'Asia/Kuala_Lumpur', text: '(UTC+08:00) Kuala Lumpur' },
        { value: 'Asia/Kuching', text: '(UTC+08:00) Kuching' },
        { value: 'Asia/Macau', text: '(UTC+08:00) Macau' },
        { value: 'Asia/Makassar', text: '(UTC+08:00) Makassar' },
        { value: 'Asia/Manila', text: '(UTC+08:00) Manila' },
        { value: 'Asia/Shanghai', text: '(UTC+08:00) Shanghai' },
        { value: 'Asia/Singapore', text: '(UTC+08:00) Singapore' },
        { value: 'Asia/Taipei', text: '(UTC+08:00) Taipei' },
        { value: 'Asia/Ulaanbaatar', text: '(UTC+08:00) Ulaanbaatar' },
        { value: 'Australia/Perth', text: '(UTC+08:00) Perth' },
        { value: 'Australia/Eucla', text: '(UTC+08:45) Eucla' },
        { value: 'Asia/Dili', text: '(UTC+09:00) Dili' },
        { value: 'Asia/Chita', text: '(UTC+09:00) Chita' },
        { value: 'Asia/Jayapura', text: '(UTC+09:00) Jayapura' },
        { value: 'Asia/Khandyga', text: '(UTC+09:00) Khandyga' },
        { value: 'Asia/Pyongyang', text: '(UTC+09:00) Pyongyang' },
        { value: 'Asia/Seoul', text: '(UTC+09:00) Seoul' },
        { value: 'Asia/Tokyo', text: '(UTC+09:00) Tokyo' },
        { value: 'Asia/Yakutsk', text: '(UTC+09:00) Yakutsk' },
        { value: 'Pacific/Palau', text: '(UTC+09:00) Palau' },
        { value: 'Australia/Adelaide', text: '(UTC+09:30) Adelaide' },
        { value: 'Australia/Broken_Hill', text: '(UTC+09:30) Broken Hill' },
        { value: 'Australia/Darwin', text: '(UTC+09:30) Darwin' },
        { value: 'Asia/Ust-Nera', text: '(UTC+10:00) Ust-Nera' },
        { value: 'Asia/Vladivostok', text: '(UTC+10:00) Vladivostok' },
        { value: 'Antarctica/DumontDUrville', text: '(UTC+10:00) DumontDUrville' },
        { value: 'Australia/Brisbane', text: '(UTC+10:00) Brisbane' },
        { value: 'Australia/Hobart', text: '(UTC+10:00) Hobart' },
        { value: 'Australia/Lindeman', text: '(UTC+10:00) Lindeman' },
        { value: 'Australia/Melbourne', text: '(UTC+10:00) Melbourne' },
        { value: 'Australia/Sydney', text: '(UTC+10:00) Sydney' },
        { value: 'Pacific/Chuuk', text: '(UTC+10:00) Chuuk' },
        { value: 'Pacific/Guam', text: '(UTC+10:00) Guam' },
        { value: 'Pacific/Port_Moresby', text: '(UTC+10:00) Port Moresby' },
        { value: 'Pacific/Saipan', text: '(UTC+10:00) Saipan' },
        { value: 'Antarctica/Macquarie', text: '(UTC+10:00) Macquarie' },
        { value: 'Australia/Lord_Howe', text: '(UTC+10:30) Lord Howe' },
        { value: 'Asia/Magadan', text: '(UTC+11:00) Magadan' },
        { value: 'Asia/Sakhalin', text: '(UTC+11:00) Sakhalin' },
        { value: 'Asia/Srednekolymsk', text: '(UTC+11:00) Srednekolymsk' },
        { value: 'Pacific/Bougainville', text: '(UTC+11:00) Bougainville' },
        { value: 'Pacific/Efate', text: '(UTC+11:00) Efate' },
        { value: 'Pacific/Guadalcanal', text: '(UTC+11:00) Guadalcanal' },
        { value: 'Pacific/Kosrae', text: '(UTC+11:00) Kosrae' },
        { value: 'Pacific/Norfolk', text: '(UTC+11:00) Norfolk' },
        { value: 'Pacific/Noumea', text: '(UTC+11:00) Noumea' },
        { value: 'Pacific/Pohnpei', text: '(UTC+11:00) Pohnpei' },
        { value: 'Asia/Anadyr', text: '(UTC+12:00) Anadyr' },
        { value: 'Asia/Kamchatka', text: '(UTC+12:00) Kamchatka' },
        { value: 'Antarctica/McMurdo', text: '(UTC+12:00) McMurdo' },
        { value: 'Pacific/Auckland', text: '(UTC+12:00) Auckland' },
        { value: 'Pacific/Fiji', text: '(UTC+12:00) Fiji' },
        { value: 'Pacific/Funafuti', text: '(UTC+12:00) Funafuti' },
        { value: 'Pacific/Kwajalein', text: '(UTC+12:00) Kwajalein' },
        { value: 'Pacific/Majuro', text: '(UTC+12:00) Majuro' },
        { value: 'Pacific/Nauru', text: '(UTC+12:00) Nauru' },
        { value: 'Pacific/Tarawa', text: '(UTC+12:00) Tarawa' },
        { value: 'Pacific/Wake', text: '(UTC+12:00) Wake' },
        { value: 'Pacific/Wallis', text: '(UTC+12:00) Wallis' },
        { value: 'Pacific/Chatham', text: '(UTC+12:45) Chatham' },
        { value: 'Pacific/Apia', text: '(UTC+13:00) Apia' },
        { value: 'Pacific/Fakaofo', text: '(UTC+13:00) Fakaofo' },
        { value: 'Pacific/Kanton', text: '(UTC+13:00) Kanton' },
        { value: 'Pacific/Tongatapu', text: '(UTC+13:00) Tongatapu' },
        { value: 'Pacific/Kiritimati', text: '(UTC+14:00) Kiritimati' }
    ];

    /**
     * Get the UTC offset in minutes for a given date and timezone.
     * Accounts for DST active at that specific date.
     *
     * @param {Date} date - The date to calculate offset for (assumed UTC)
     * @param {string} timezone - IANA timezone name (e.g., 'America/New_York')
     * @returns {number} Offset in minutes from UTC (negative for west of UTC, positive for east)
     */
    static offset(date: Date, timezone: string): number {
        const localOffset: number = date.getTimezoneOffset();
        try {
            const convertedDate: Date = new Date(date.toLocaleString('en-US', { timeZone: timezone }));
            if (!isNaN(convertedDate.getTime())) {
                return ((date.getTime() - convertedDate.getTime()) / 60000) + localOffset;
            }
            return 0;
        } catch (error) {
            return 0;
        }
    }

    /**
     * Convert a UTC date to the display wall-clock time in a target timezone.
     * Adds the timezone offset to shift UTC to local time in the target zone.
     *
     * @param {Date} date - UTC date to convert
     * @param {string} timezone - Target IANA timezone name
     * @returns {Date} A Date representing the wall-clock time in the target timezone
     */
    static add(date: Date, timezone: string): Date {
        return this.convert(date, date.getTimezoneOffset(), timezone);
    }

    /**
     * Remove the timezone offset from a wall-clock date, returning UTC equivalent.
     * Interprets the input date as a local wall-clock in the given timezone
     * and converts it to the equivalent UTC instant.
     *
     * @param {Date} date - Wall-clock date in the source timezone (as a Date object)
     * @param {string} timezone - Source IANA timezone name
     * @returns {Date} UTC date equivalent
     */
    static remove(date: Date, timezone: string): Date {
        return this.convert(date, timezone, date.getTimezoneOffset());
    }

    /**
     * Remove the local runtime offset from a date.
     * Useful when Date objects are created in local time and need normalization to UTC.
     *
     * @param {Date} date - Date in local runtime timezone
     * @returns {Date} UTC-equivalent date with local offset removed
     */
    static removeLocalOffset(date: Date): Date {
        return new Date(date.getTime() - (date.getTimezoneOffset() * 60000));
    }

    /**
     * Convert a wall-clock time from one timezone/offset to another.
     * Takes a date interpreted in the source timezone and converts it to target timezone.
     *
     * @param {Date} date - Wall-clock date (assumed to be in source timezone)
     * @param {number|string} fromOffsetOrZone - Source timezone: numeric offset (minutes) or IANA name
     * @param {number|string} toOffsetOrZone - Target timezone: numeric offset (minutes) or IANA name
     * @returns {Date} Wall-clock date in target timezone
     */
    static convert(
        date: Date,
        fromOffsetOrZone: number | string,
        toOffsetOrZone: number | string
    ): Date {
        // Resolve numeric offsets when zone names are provided
        const fromOffset: number = typeof fromOffsetOrZone === 'number'
            ? fromOffsetOrZone
            : this.offset(date, fromOffsetOrZone as string);

        const toOffset: number = typeof toOffsetOrZone === 'number'
            ? toOffsetOrZone
            : this.offset(date, toOffsetOrZone as string);

        const fromLocalOffset: number = date.getTimezoneOffset();
        // Apply the delta between source and target offsets
        date = new Date(date.getTime() + (fromOffset - toOffset) * 60000);
        const toLocalOffset: number = date.getTimezoneOffset();
        // Compensate for local DST offset changes that may have occurred
        return new Date(date.getTime() + (toLocalOffset - fromLocalOffset) * 60000);
    }

    /**
     * Get a list of common IANA timezone identifiers for use in editor/UI selectors.
     *
     * @returns {TimezoneFields[]} Array of IANA timezone names sorted alphabetically
     */
    public static getLocalTimezoneName(): string {
        return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    }

    static getTimezoneData(): TimezoneFields[] {
        return [...this.timezoneData].sort();
    }
}
