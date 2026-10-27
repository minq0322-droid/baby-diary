export function toMarkdown(all, month) {
  const pages = all.pages
    .filter((page) => !month || page.date.startsWith(month))
    .sort(
      (a, b) =>
        a.date.localeCompare(b.date) || a.childId.localeCompare(b.childId),
    );
  const children = new Map(all.children.map((child) => [child.id, child.name]));
  const members = new Map(
    all.members.map((member) => [member.id, member.displayName]),
  );
  all.members.forEach((member) =>
    members.set(member.color, member.displayName),
  );
  const tags = new Map(
    all.tags.map((tag) => [tag.id, `${tag.emoji}${tag.label}`]),
  );
  const lines = [];
  let currentMonth = '';
  for (const page of pages) {
    const pageMonth = page.date.slice(0, 7);
    if (currentMonth !== pageMonth) {
      lines.push(
        `# ${pageMonth.slice(0, 4)}년 ${Number(pageMonth.slice(5))}월`,
        '',
      );
      currentMonth = pageMonth;
    }
    const [, m, d] = page.date.split('-');
    const weekday = new Intl.DateTimeFormat('ko-KR', {
      weekday: 'short',
      timeZone: 'Asia/Seoul',
    }).format(new Date(`${page.date}T00:00:00+09:00`));
    lines.push(
      `## ${Number(m)}월 ${Number(d)}일 (${weekday}) · ${children.get(page.childId) ?? page.childId}`,
      '',
    );
    lines.push(
      `- ${page.text.replace(/\n/g, '\n  ')} — ${members.get(page.authorId) ?? page.authorId}`,
    );
    const badges = page.tagIds
      .map((id) => tags.get(id))
      .filter(Boolean)
      .join(' · ');
    if (badges) lines.push(`배지: ${badges}`);
    if (page.drawing.length || page.photos.length)
      lines.push(
        `(${[page.drawing.length ? '그림 있음' : '', page.photos.length ? `사진 ${page.photos.length}장` : ''].filter(Boolean).join(', ')})`,
      );
    for (const comment of all.comments.filter(
      (item) => item.pageId === page.id,
    ))
      lines.push(
        `  - 💬 ${comment.content} — ${members.get(comment.authorId) ?? comment.authorId}`,
      );
    for (const reaction of all.reactions.filter(
      (item) => item.pageId === page.id,
    ))
      lines.push(
        `  - ${reaction.emoji} ${members.get(reaction.memberId) ?? reaction.memberId}`,
      );
    lines.push('');
  }
  return lines.join('\n').trimEnd() + (lines.length ? '\n' : '');
}

export function toDatedArchive(snapshot) {
  const files = [];
  const dates = [...new Set(snapshot.pages.map((page) => page.date))].sort();
  for (const date of dates) {
    const directory = 'diary/' + date.split('-').join('/');
    const pages = snapshot.pages
      .filter((page) => page.date === date)
      .sort((a, b) => a.id.localeCompare(b.id));
    for (const page of pages)
      files.push({
        path:
          directory +
          '/' +
          encodeURIComponent(page.childId) +
          '-' +
          page.authorId +
          '.json',
        content: JSON.stringify(page, null, 2),
      });
    files.push({
      path: directory + '.md',
      content: toMarkdown({ ...snapshot, pages }),
    });
  }
  return files;
}
