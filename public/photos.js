// Most images are local; two source-hosted photographs retain their original license links.
export const remotePhotos={
 prunes:'https://images.pexels.com/photos/11828235/pexels-photo-11828235.jpeg?auto=compress&cs=tinysrgb&w=600',
 churchkhela:'https://images.pexels.com/photos/37306054/pexels-photo-37306054/free-photo-of-close-up-of-traditional-churchkhela-sweets.jpeg?auto=compress&cs=tinysrgb&w=600'
};
export const photoPath=art=>remotePhotos[art]||'./media/'+art+'.jpg';
