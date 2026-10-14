begin;

set local role service_role;

-- Administrator can read a listing hidden from public users.
select property_id, approved
from public.properties
where property_id = 'demo-private-1';

-- Administrator can approve that listing.
update public.properties
set approved = true
where property_id = 'demo-private-1'
returning property_id, approved;

-- RLS bypass does not bypass database CHECK constraints.
do $$
begin
  begin
    update public.properties
    set price = -1
    where property_id = 'demo-private-1';

    raise exception 'FAIL: negative price was accepted';
  exception
    when check_violation then
      raise notice 'PASS: administrator negative price blocked by CHECK constraint';
  end;
end;
$$;

select
  'PASS: administrator read and approval succeeded; negative price rejected' as result,
  property_id,
  approved,
  price
from public.properties
where property_id = 'demo-private-1' and approved = true;

-- Restore the original data after testing.
rollback;