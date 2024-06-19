interface ISiteMetadataResult {
  siteTitle: string;
  siteUrl: string;
  description: string;
  keywords: string;
  logo: string;
  navLinks: {
    name: string;
    url: string;
  }[];
}

const data: ISiteMetadataResult = {
  siteTitle: "Hong's Workouts Map",
  siteUrl: 'https://yeweihong.github.io/workoutspage',
  logo: 'https://avatars.githubusercontent.com/u/49354927?v=4',
  description: 'Personal site and photo',
  keywords: 'workouts, running, cycling, riding, roadtrip, hiking, swimming',
  navLinks: [
    {
      name: 'Weibo',
      url: 'https://weibo.com/u/7827405869',
    },
    {
      name: 'Photos',
      url: 'https://500px.com.cn/sahazuber',
    },
  ],
};

export default data;
