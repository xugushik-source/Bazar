// Most images are local; two source-hosted photographs retain their original license links.
export const remotePhotos={
 prunes:'https://images.pexels.com/photos/11828235/pexels-photo-11828235.jpeg?auto=compress&cs=tinysrgb&w=600',
 churchkhela:'https://images.pexels.com/photos/37306054/pexels-photo-37306054/free-photo-of-close-up-of-traditional-churchkhela-sweets.jpeg?auto=compress&cs=tinysrgb&w=600'
};
export const photoPath=art=>remotePhotos[art]||'./media/'+art+'.jpg';
// Department photos a supplier can pick before any product of that kind exists.
export const artLabels={
 cheese:{ru:'Сыр',hy:'Պանիր',ka:'ყველი'},dairy:{ru:'Мацони, молоко',hy:'Մածուն, կաթ',ka:'მაწონი, რძე'},eggs:{ru:'Яйца',hy:'Ձու',ka:'კვერცხი'},bread:{ru:'Хлеб',hy:'Հաց',ka:'პური'},
 meat:{ru:'Мясо',hy:'Միս',ka:'ხორცი'},chicken:{ru:'Курица',hy:'Հավ',ka:'ქათამი'},trout:{ru:'Форель',hy:'Իշխան',ka:'კალმახი'},sausage:{ru:'Бастурма, колбасы',hy:'Բաստուրմա, երշիկ',ka:'ბასტურმა, ძეხვი'},
 pickles:{ru:'Соленья',hy:'Թթու',ka:'მწნილი'},flour:{ru:'Мука, бакалея',hy:'Ալյուր, նպարեղեն',ka:'ფქვილი, ბაკალეა'},drinks:{ru:'Вода, напитки',hy:'Ջուր, ըմպելիքներ',ka:'წყალი, სასმელები'},household:{ru:'Хозтовары',hy:'Տնտեսական ապրանքներ',ka:'სამეურნეო საქონელი'}
};
// Picture for a department that has no products yet (shown with «Скоро»).
export const categoryArt={dairy:'cheese',eggs:'eggs',bread:'bread',meat:'meat',trout:'trout',deli:'sausage',preserves:'pickles',pantry:'flour',drinks:'drinks',household:'household'};
